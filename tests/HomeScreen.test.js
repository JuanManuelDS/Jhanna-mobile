import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { getGreeting } from '../src/utils/greeting';
import { DEFAULT_START_BELL, DEFAULT_END_BELL } from '../src/utils/bells';

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

jest.mock('../src/store/useAppStore', () => {
  const store = {
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
  return { __esModule: true, default: jest.fn((selector) => selector(store)) };
});

jest.mock('../src/hooks/useBells', () => ({
  useBells: () => ({ playStartBell: jest.fn(), playEndBell: jest.fn() }),
  playBellPreview: jest.fn(),
  stopBellPreview: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
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

  it('selects a predefined meditation and Begin sends those params', () => {
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByLabelText('Morning Calm'));

    expect(mockUpdateSessionDefaults).toHaveBeenCalledWith({ lastPredefinedId: 1 });

    fireEvent.press(getByLabelText('Begin Session'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Session', {
      prepSeconds: 60,
      meditationTime: 10,
      startBell: 'Aguda',
      endBell: 'Grave',
    });
  });

  it('tapping the same predefined again deselects it (toggle)', () => {
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Predefined'));
    fireEvent.press(getByLabelText('Morning Calm'));
    fireEvent.press(getByLabelText('Morning Calm'));
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
