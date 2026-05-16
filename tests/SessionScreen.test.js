import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SessionScreen from '../src/screens/SessionScreen';
import SessionControls from '../src/components/SessionControls';

const mockRoute = { params: { prepTime: 0, meditationTime: 10 } };

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

// Mock the entire session service — we test it separately
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

// Mock useSessionClock — returns a controllable elapsed value
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

let lastPredefinedAudioCall = null;
jest.mock('../src/hooks/usePredefinedAudio', () => ({
  usePredefinedAudio: jest.fn((args) => {
    lastPredefinedAudioCall = args;
  }),
}));

jest.mock('../src/components/CircularTimer', () => 'CircularTimer');
jest.mock('../src/components/PhaseLabel', () => 'PhaseLabel');
jest.mock('../src/components/PhaseDots', () => 'PhaseDots');

beforeEach(() => {
  jest.clearAllMocks();
  lastPredefinedAudioCall = null;
  mockElapsedSec = 0;
  mockCommitCompletedSession.mockResolvedValue({
    duration: 1,
    streak: { current: 1, longest: 1 },
  });
});

describe('SessionScreen', () => {
  it('calls sessionService.start on mount with correct session params', async () => {
    render(<SessionScreen route={mockRoute} navigation={mockNavigation} />);
    await act(async () => {});
    expect(mockSessionStart).toHaveBeenCalledTimes(1);
    expect(mockSessionStart).toHaveBeenCalledWith(
      expect.objectContaining({ medSec: 600, isPredefined: false })
    );
  });

  it('Pause button toggles label between Pause and Resume', () => {
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    expect(getByLabelText('Pause')).toBeTruthy();
    fireEvent.press(getByLabelText('Pause'));
    expect(getByLabelText('Resume')).toBeTruthy();
    fireEvent.press(getByLabelText('Resume'));
    expect(getByLabelText('Pause')).toBeTruthy();
  });

  it('Pause calls sessionService.pause; Resume calls sessionService.resume', () => {
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Pause'));
    expect(mockSessionPause).toHaveBeenCalledTimes(1);
    fireEvent.press(getByLabelText('Resume'));
    expect(mockSessionResume).toHaveBeenCalledTimes(1);
  });

  it('Stop while running opens confirmation modal', () => {
    const { getByLabelText, getByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    expect(getByText('End Session?')).toBeTruthy();
  });

  it('Stop calls sessionService.pause to freeze the timer', () => {
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    expect(mockSessionPause).toHaveBeenCalledTimes(1);
  });

  it('Continue closes modal and calls sessionService.resume', () => {
    const { getByLabelText, queryByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('Continue'));
    expect(queryByText('End Session?')).toBeNull();
    expect(mockSessionResume).toHaveBeenCalledTimes(1);
  });

  it('Tapping the backdrop behaves identically to Continue', () => {
    const { getByLabelText, queryByText, getByTestId } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByTestId('modal-backdrop'));
    expect(queryByText('End Session?')).toBeNull();
    expect(mockSessionResume).toHaveBeenCalledTimes(1);
  });

  it('Rapid double-tap End Session calls commitCompletedSession exactly once', async () => {
    // Give some elapsed time so we are past prep
    mockElapsedSec = 5;
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('End Session'));
    fireEvent.press(getByLabelText('End Session'));

    await act(async () => {});

    expect(mockCommitCompletedSession).toHaveBeenCalledTimes(1);
    expect(mockNavigation.replace).toHaveBeenCalledTimes(1);
  });

  it('End Session calls sessionService.stop', async () => {
    mockElapsedSec = 5;
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('End Session'));
    await act(async () => {});
    expect(mockSessionStop).toHaveBeenCalled();
  });

  it('Stopping while already paused leaves session paused after Continue', () => {
    const { getByLabelText, queryByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );
    fireEvent.press(getByLabelText('Pause'));
    fireEvent.press(getByLabelText('Stop'));
    fireEvent.press(getByLabelText('Continue'));
    expect(getByLabelText('Resume')).toBeTruthy();
    expect(queryByText('End Session?')).toBeNull();
    // Continue should NOT call resume because session was already paused before stop
    expect(mockSessionResume).not.toHaveBeenCalled();
  });
});

describe('SessionScreen — predefined sessions', () => {
  const predefinedRoute = (overrides = {}) => ({
    params: {
      prepSeconds: 0,
      meditationTime: 60,
      predefined: {
        id: 'day-1',
        kind: 'day',
        audio: {},
        audioDurationSec: 33 * 60,
        audioStartOffsetSec: 27 * 60,
        endsWithAudio: false,
        ...overrides,
      },
    },
  });

  it('does NOT start bell triggers for predefined sessions', async () => {
    render(<SessionScreen route={predefinedRoute()} navigation={mockNavigation} />);
    await act(async () => {});
    expect(mockSessionStart).toHaveBeenCalledWith(
      expect.objectContaining({ isPredefined: true })
    );
  });

  it('does not invoke start or end bell hooks during prep → meditation transition', async () => {
    const route = {
      params: {
        prepSeconds: 1,
        meditationTime: 60,
        predefined: {
          id: 'day-1',
          kind: 'day',
          audio: {},
          audioDurationSec: 30 * 60,
          audioStartOffsetSec: 30 * 60,
          endsWithAudio: false,
        },
      },
    };
    const { rerender } = render(<SessionScreen route={route} navigation={mockNavigation} />);

    // Simulate crossing the prep→meditation boundary
    mockElapsedSec = 2;
    const { useSessionClock } = require('../src/hooks/useSessionClock');
    useSessionClock.mockReturnValue(2);

    rerender(<SessionScreen route={route} navigation={mockNavigation} />);
    await act(async () => {});

    expect(mockPlayStartBell).not.toHaveBeenCalled();
    expect(mockPlayEndBell).not.toHaveBeenCalled();
  });

  it('passes predefined props to usePredefinedAudio with onAudioEnd only when endsWithAudio', () => {
    render(<SessionScreen route={predefinedRoute()} navigation={mockNavigation} />);
    expect(lastPredefinedAudioCall).toBeTruthy();
    expect(lastPredefinedAudioCall.predefined).toEqual(
      expect.objectContaining({ id: 'day-1', kind: 'day' })
    );
    expect(lastPredefinedAudioCall.onAudioEnd).toBeUndefined();
  });

  it('Short Instructions: onAudioEnd commits session and navigates to Complete', async () => {
    render(
      <SessionScreen
        route={predefinedRoute({
          id: 'short-instructions',
          kind: 'short',
          audioDurationSec: 7 * 60,
          audioStartOffsetSec: 0,
          endsWithAudio: true,
        })}
        navigation={mockNavigation}
      />
    );

    expect(typeof lastPredefinedAudioCall.onAudioEnd).toBe('function');

    await act(async () => {
      lastPredefinedAudioCall.onAudioEnd();
    });

    await waitFor(() => {
      expect(mockCommitCompletedSession).toHaveBeenCalledTimes(1);
      expect(mockNavigation.replace).toHaveBeenCalledWith(
        'Complete',
        expect.objectContaining({ duration: 1 })
      );
    });
  });
});

describe('SessionControls styling', () => {
  it('Pause button uses terracotta shadow and Stop uses coral shadow, both pill-shaped', () => {
    const { getByLabelText } = render(
      <SessionControls
        isRunning={true}
        onPauseResume={jest.fn()}
        onStop={jest.fn()}
      />
    );

    const pauseBtn = getByLabelText('Pause');
    const stopBtn = getByLabelText('Stop');

    const resolveStyle = (styleOrFn) => {
      const raw = typeof styleOrFn === 'function' ? styleOrFn({ pressed: false }) : styleOrFn;
      return StyleSheet.flatten(Array.isArray(raw) ? raw.filter(Boolean) : raw);
    };

    const pauseStyle = resolveStyle(pauseBtn.props.style);
    const stopStyle = resolveStyle(stopBtn.props.style);

    expect(pauseStyle.shadowColor).toBe('#E8936A');
    expect(pauseStyle.borderRadius).toBe(28);
    expect(stopStyle.shadowColor).toBe('#D4796A');
    expect(stopStyle.borderRadius).toBe(28);
  });
});
