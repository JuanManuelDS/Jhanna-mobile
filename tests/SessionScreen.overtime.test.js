import { render, fireEvent, act } from '@testing-library/react-native';
import SessionScreen from '../src/screens/SessionScreen';

const mockNavigation = {
  replace: jest.fn(),
  popToTop: jest.fn(),
};

const mockCommitCompletedSession = jest.fn(() =>
  Promise.resolve({ duration: 1, streak: { current: 1, longest: 1 } })
);

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../src/store/useAppStore', () => ({
  __esModule: true,
  default: jest.fn((selector) =>
    selector({ commitCompletedSession: mockCommitCompletedSession })
  ),
}));

const mockSessionStart = jest.fn(() => Promise.resolve());
const mockSessionPause = jest.fn(() => Promise.resolve());
const mockSessionResume = jest.fn(() => Promise.resolve());
const mockSessionStop = jest.fn(() => Promise.resolve());
const mockSessionUpdatePhase = jest.fn();

jest.mock('../src/services/sessionService', () => ({
  start: (...args) => mockSessionStart(...args),
  pause: (...args) => mockSessionPause(...args),
  resume: (...args) => mockSessionResume(...args),
  stop: (...args) => mockSessionStop(...args),
  updatePhase: (...args) => mockSessionUpdatePhase(...args),
}));

let mockElapsedSec = 0;
jest.mock('../src/hooks/useSessionClock', () => ({
  useSessionClock: jest.fn(() => mockElapsedSec),
}));

const mockPlayStartBell = jest.fn();
const mockPlayEndBell = jest.fn();
jest.mock('../src/hooks/useBells', () => ({
  useBells: jest.fn(() => ({
    playStartBell: mockPlayStartBell,
    playEndBell: mockPlayEndBell,
  })),
}));

jest.mock('../src/hooks/usePredefinedAudio', () => ({
  usePredefinedAudio: jest.fn(),
}));

jest.mock('../src/components/CircularTimer', () => 'CircularTimer');
jest.mock('../src/components/PhaseLabel', () => 'PhaseLabel');
jest.mock('../src/components/PhaseDots', () => 'PhaseDots');

beforeEach(() => {
  jest.clearAllMocks();
  mockElapsedSec = 0;
  const { useSessionClock } = require('../src/hooks/useSessionClock');
  useSessionClock.mockImplementation(() => mockElapsedSec);
  mockCommitCompletedSession.mockResolvedValue({
    duration: 1,
    streak: { current: 1, longest: 1 },
  });
});

describe('SessionScreen — overtime behavior', () => {
  // prep=0 keeps phase math simple: elapsedSec maps directly to medElapsed.
  const route = { params: { prepSeconds: 0, meditationTime: 10 } };

  function advanceTo(seconds, rerender) {
    mockElapsedSec = seconds;
    const { useSessionClock } = require('../src/hooks/useSessionClock');
    useSessionClock.mockReturnValue(seconds);
    rerender(<SessionScreen route={route} navigation={mockNavigation} />);
  }

  it('rings the end bell exactly once when the meditation hits 00:00 and does not auto-complete', async () => {
    const { rerender } = render(
      <SessionScreen route={route} navigation={mockNavigation} />
    );

    advanceTo(600, rerender); // exact end mark
    await act(async () => {});

    expect(mockPlayEndBell).toHaveBeenCalledTimes(1);
    expect(mockCommitCompletedSession).not.toHaveBeenCalled();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
    expect(mockSessionStop).not.toHaveBeenCalled();

    // Advancing further into overtime must not trigger completion or another bell.
    advanceTo(650, rerender);
    advanceTo(720, rerender);
    await act(async () => {});

    expect(mockPlayEndBell).toHaveBeenCalledTimes(1);
    expect(mockCommitCompletedSession).not.toHaveBeenCalled();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it('saves duration equal to original meditation time plus overtime (rounded up) when user stops during overtime', async () => {
    const { rerender, getByLabelText } = render(
      <SessionScreen route={route} navigation={mockNavigation} />
    );

    // 11 min 40 s of meditation elapsed (10 min original + 1 min 40 s overtime)
    advanceTo(700, rerender);
    await act(async () => {});

    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('End Session'));
    await act(async () => {});

    expect(mockCommitCompletedSession).toHaveBeenCalledTimes(1);
    expect(mockCommitCompletedSession).toHaveBeenCalledWith({ durationMinutes: 12 });
    expect(mockNavigation.replace).toHaveBeenCalledWith(
      'Complete',
      expect.objectContaining({ duration: 12 })
    );
  });

  it('does not ring the end bell when the user stops before the original end mark', async () => {
    const { rerender, getByLabelText } = render(
      <SessionScreen route={route} navigation={mockNavigation} />
    );

    advanceTo(300, rerender); // halfway through
    await act(async () => {});

    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('End Session'));
    await act(async () => {});

    expect(mockPlayEndBell).not.toHaveBeenCalled();
    expect(mockCommitCompletedSession).toHaveBeenCalledWith({ durationMinutes: 5 });
  });

  it('does not replay the end bell across pause/resume during overtime', async () => {
    const { rerender, getByLabelText } = render(
      <SessionScreen route={route} navigation={mockNavigation} />
    );

    advanceTo(605, rerender); // crossed the end mark — one bell
    await act(async () => {});
    expect(mockPlayEndBell).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText('Pause'));
    fireEvent.press(getByLabelText('Resume'));

    advanceTo(660, rerender); // further overtime after resume
    await act(async () => {});

    expect(mockPlayEndBell).toHaveBeenCalledTimes(1);
  });
});
