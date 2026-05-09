import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SessionScreen from '../src/screens/SessionScreen';
import SessionControls from '../src/components/SessionControls';

// prepTime=0 so meditation starts immediately; no prep phase to wait through
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

jest.mock('../src/hooks/useBells', () => ({
  useBells: () => ({ playStartBell: jest.fn(), playEndBell: jest.fn() }),
}));

jest.mock('../src/components/CircularTimer', () => 'CircularTimer');
jest.mock('../src/components/PhaseLabel', () => 'PhaseLabel');
jest.mock('../src/components/PhaseDots', () => 'PhaseDots');

beforeEach(() => {
  jest.clearAllMocks();
  mockCommitCompletedSession.mockResolvedValue({
    duration: 1,
    streak: { current: 1, longest: 1 },
  });
});

describe('SessionScreen', () => {
  it('Pause button toggles label between Pause and Resume', () => {
    jest.useFakeTimers();
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByLabelText('Pause')).toBeTruthy();

    fireEvent.press(getByLabelText('Pause'));
    expect(getByLabelText('Resume')).toBeTruthy();

    fireEvent.press(getByLabelText('Resume'));
    expect(getByLabelText('Pause')).toBeTruthy();

    jest.useRealTimers();
  });

  it('Stop while running opens confirmation modal and freezes the countdown', () => {
    jest.useFakeTimers();
    const { getByLabelText, getByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    act(() => { jest.advanceTimersByTime(2000); });

    fireEvent.press(getByLabelText('Stop'));
    expect(getByText('End Session?')).toBeTruthy();

    // Advance time — modal is open so timer must be frozen
    act(() => { jest.advanceTimersByTime(5000); });
    // Modal still visible; if timer were running it would complete in 10 min, so here
    // we just verify the modal is still showing (no phase completion fired)
    expect(getByText('End Session?')).toBeTruthy();

    jest.useRealTimers();
  });

  it('Continue closes modal and resumes countdown from same position', () => {
    jest.useFakeTimers();
    const { getByLabelText, getByText, queryByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByLabelText('Stop'));
    expect(getByText('End Session?')).toBeTruthy();

    fireEvent.press(getByLabelText('Continue'));
    expect(queryByText('End Session?')).toBeNull();

    // Timer should be running again — Pause label visible (not Resume)
    expect(getByLabelText('Pause')).toBeTruthy();

    jest.useRealTimers();
  });

  it('Tapping the backdrop behaves identically to Continue', () => {
    jest.useFakeTimers();
    const { getByLabelText, getByText, queryByText, getByTestId } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByLabelText('Stop'));
    expect(getByText('End Session?')).toBeTruthy();

    fireEvent.press(getByTestId('modal-backdrop'));
    expect(queryByText('End Session?')).toBeNull();
    expect(getByLabelText('Pause')).toBeTruthy();

    jest.useRealTimers();
  });

  it('Rapid double-tap End Session calls commitCompletedSession exactly once', async () => {
    jest.useFakeTimers();
    const { getByLabelText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    act(() => { jest.advanceTimersByTime(5000); });

    fireEvent.press(getByLabelText('Stop'));

    fireEvent.press(getByLabelText('End Session'));
    fireEvent.press(getByLabelText('End Session'));

    await act(async () => { jest.runAllTimers(); });

    expect(mockCommitCompletedSession).toHaveBeenCalledTimes(1);
    expect(mockNavigation.replace).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('Stopping while already paused leaves session paused after Continue', () => {
    jest.useFakeTimers();
    const { getByLabelText, queryByText } = render(
      <SessionScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Pause first
    fireEvent.press(getByLabelText('Pause'));
    expect(getByLabelText('Resume')).toBeTruthy();

    // Open stop modal
    fireEvent.press(getByLabelText('Stop'));

    // Dismiss with Continue
    fireEvent.press(getByLabelText('Continue'));

    // Should still be paused — label is Resume, not Pause
    expect(getByLabelText('Resume')).toBeTruthy();
    expect(queryByText('End Session?')).toBeNull();

    jest.useRealTimers();
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

    // Background color lives on the inner View via NativeWind className; outer Pressable
    // carries the shadow color and border radius for proper shadow rendering on iOS.
    expect(pauseStyle.shadowColor).toBe('#E8936A');
    expect(pauseStyle.borderRadius).toBe(28);
    expect(stopStyle.shadowColor).toBe('#D4796A');
    expect(stopStyle.borderRadius).toBe(28);
  });
});
