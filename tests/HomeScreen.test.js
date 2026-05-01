import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { getGreeting } from '../src/utils/greeting';

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

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen navigation={mockNavigation} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the streak badge with placeholder count and label', () => {
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

  it('renders both picker cards with labels, sublabels, values and units', () => {
    const { getByText, getAllByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('Preparation')).toBeTruthy();
    expect(getByText('Settle into stillness')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('Meditation')).toBeTruthy();
    expect(getByText('Jhanna practice')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getAllByText('min').length).toBeGreaterThanOrEqual(2);
  });

  it('renders a pressable Begin Session button', () => {
    const { getByLabelText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText('Begin Session')).toBeTruthy();
    fireEvent.press(getByLabelText('Begin Session'));
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
