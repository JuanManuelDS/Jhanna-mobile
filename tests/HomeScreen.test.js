import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { getGreeting } from '../src/utils/greeting';

jest.mock('../src/utils/predefinedMeditations', () => {
  const actual = jest.requireActual('../src/utils/predefinedMeditations');
  return {
    ...actual,
    // Default to a never-resolving promise so tests that don't await it
    // don't trigger uncontrolled setState. Override per-test as needed.
    getPredefinedAudioDurationMs: jest.fn(() => new Promise(() => {})),
  };
});

const {
  getPredefinedAudioDurationMs,
  _resetPredefinedAudioDurationCache,
} = require('../src/utils/predefinedMeditations');

const mockNavigation = { navigate: jest.fn() };

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...rest }) =>
      React.createElement(View, rest, children),
    SafeAreaProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const mockUpdateSettings = jest.fn();
const mockUpdateSessionDefaults = jest.fn();

const mockStoreOverrides = { current: {} };

jest.mock('../src/store/useAppStore', () => {
  const baseStore = {
    sessions: [],
    streak: { current: 14, longest: 31 },
    settings: {
      prepSeconds: 60,
      meditationTime: 10,
      startBell: 'Aguda',
      endBell: 'Grave',
    },
    sessionDefaults: { lastPredefinedId: null },
    hydrated: true,
    hydrate: jest.fn(),
    updateSettings: (...args) => mockUpdateSettings(...args),
    updateSessionDefaults: (...args) => mockUpdateSessionDefaults(...args),
    commitCompletedSession: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn((selector) => selector({ ...baseStore, ...mockStoreOverrides.current })),
  };
});

jest.mock('../src/hooks/useBells', () => ({
  useBells: () => ({ playStartBell: jest.fn(), playEndBell: jest.fn() }),
  playBellPreview: jest.fn(),
  stopBellPreview: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreOverrides.current = {};
  _resetPredefinedAudioDurationCache();
  // Reset the mock to a never-resolving promise so the default behavior
  // does not trigger uncontrolled setState in tests that don't await it.
  getPredefinedAudioDurationMs.mockImplementation(() => new Promise(() => {}));
});

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen navigation={mockNavigation} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the streak badge with store count and label', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('14')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();
  });

  it('renders a pressable Statistics button', () => {
    const { getByLabelText } = render(<HomeScreen navigation={mockNavigation} />);
    const btn = getByLabelText('Statistics');
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
  });

  it('renders both picker cards with labels and the manual tab content', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('Preparation')).toBeTruthy();
    expect(getByText('Settle into stillness')).toBeTruthy();
    expect(getByText('Meditation')).toBeTruthy();
    expect(getByText('Jhanna practice')).toBeTruthy();
    expect(getByText('sec')).toBeTruthy();
    expect(getByText('min')).toBeTruthy();
  });

  it('shows prep time as raw seconds with "sec" unit when prepSeconds is 60', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('60')).toBeTruthy();
    expect(getByText('sec')).toBeTruthy();
  });

  it('shows the default bells in manual mode', () => {
    const { getByLabelText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByLabelText('Beginning bell: Aguda')).toBeTruthy();
    expect(getByLabelText('Finishing bell: Grave')).toBeTruthy();
  });

  it('Begin button is enabled in manual tab and navigates with manual params', () => {
    const { getByLabelText } = render(<HomeScreen navigation={mockNavigation} />);
    const btn = getByLabelText('Begin Session');
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
    fireEvent.press(btn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Session', {
      prepSeconds: 60,
      meditationTime: 10,
      startBell: 'Aguda',
      endBell: 'Grave',
    });
  });

  it('Begin button is disabled on Predefined tab when nothing is selected', () => {
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    const btn = getByLabelText('Begin Session');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('selects Day 1 and Begin navigates with predefined payload (60 min, day kind)', async () => {
    getPredefinedAudioDurationMs.mockResolvedValue(33 * 60 * 1000);
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByLabelText('Day 1 Chantings'));

    expect(mockUpdateSessionDefaults).toHaveBeenCalledWith({ lastPredefinedId: 'day-1' });

    await act(async () => {
      fireEvent.press(getByLabelText('Begin Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({
          prepSeconds: 30,
          meditationTime: 60,
          predefined: expect.objectContaining({
            id: 'day-1',
            kind: 'day',
            endsWithAudio: false,
            audio: expect.anything(),
            audioDurationSec: 33 * 60,
            audioStartOffsetSec: 27 * 60,
          }),
        })
      );
    });
  });

  it('selects Short Instructions and Begin navigates with endsWithAudio: true', async () => {
    getPredefinedAudioDurationMs.mockResolvedValue(7 * 60 * 1000);
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByLabelText('Short Instructions'));

    expect(mockUpdateSessionDefaults).toHaveBeenCalledWith({
      lastPredefinedId: 'short-instructions',
    });

    await act(async () => {
      fireEvent.press(getByLabelText('Begin Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({
          prepSeconds: 30,
          meditationTime: 7,
          predefined: expect.objectContaining({
            id: 'short-instructions',
            kind: 'short',
            endsWithAudio: true,
            audioStartOffsetSec: 0,
          }),
        })
      );
    });
  });

  it('tapping the same predefined again deselects it (toggle)', () => {
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByLabelText('Day 1 Chantings'));
    fireEvent.press(getByLabelText('Day 1 Chantings'));
    expect(mockUpdateSessionDefaults).toHaveBeenLastCalledWith({ lastPredefinedId: null });
  });

  it('switching tabs preserves manual values (re-renders show same prep)', () => {
    const { getByText, getByLabelText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('60')).toBeTruthy();
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByText('Manual'));
    expect(getByText('60')).toBeTruthy();
    expect(getByLabelText('Beginning bell: Aguda')).toBeTruthy();
  });

  it('persisted lastPredefinedId not in catalog is treated as no selection', async () => {
    mockStoreOverrides.current = { sessionDefaults: { lastPredefinedId: 'legacy-id' } };
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    const card = getByLabelText('Day 1 Chantings');
    expect(card.props.accessibilityState?.selected).toBeFalsy();
    // Stale value is cleared in storage on mount.
    await waitFor(() => {
      expect(mockUpdateSessionDefaults).toHaveBeenCalledWith({ lastPredefinedId: null });
    });
  });

  describe('greeting', () => {
    it('returns morning before noon', () => {
      expect(getGreeting(8)).toBe('Good morning,');
      expect(getGreeting(0)).toBe('Good morning,');
      expect(getGreeting(11)).toBe('Good morning,');
    });

    it('returns afternoon between 12 and 16', () => {
      expect(getGreeting(12)).toBe('Good afternoon,');
      expect(getGreeting(16)).toBe('Good afternoon,');
    });

    it('returns evening from 17 onwards', () => {
      expect(getGreeting(17)).toBe('Good evening,');
      expect(getGreeting(20)).toBe('Good evening,');
      expect(getGreeting(23)).toBe('Good evening,');
    });

    it('selects greeting based on the device hour at render time', () => {
      const cases = [
        [8, /Good morning,/],
        [13, /Good afternoon,/],
        [20, /Good evening,/],
      ];
      for (const [hour, pattern] of cases) {
        const spy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(hour);
        const { queryAllByText, unmount } = render(<HomeScreen navigation={mockNavigation} />);
        expect(queryAllByText(pattern).length).toBeGreaterThan(0);
        unmount();
        spy.mockRestore();
      }
    });
  });
});
