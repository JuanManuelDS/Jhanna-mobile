import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatsScreen from '../src/screens/StatsScreen';
import useAppStore from '../src/store/useAppStore';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Pass = ({ children, ...rest }) => React.createElement(View, rest, children);
  const TextNode = ({ children, ...rest }) => React.createElement(Text, rest, children);
  return {
    __esModule: true,
    default: Pass,
    Svg: Pass,
    Rect: Pass,
    Line: Pass,
    Path: Pass,
    Circle: Pass,
    Defs: Pass,
    LinearGradient: Pass,
    RadialGradient: Pass,
    Stop: Pass,
    G: Pass,
    Text: TextNode,
  };
});

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

jest.mock('../src/store/useAppStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

function setStore(partial) {
  const store = {
    sessions: [],
    streak: { current: 0, longest: 0 },
    settings: { prepTime: 1, meditationTime: 10 },
    hydrated: true,
    ...partial,
  };
  useAppStore.mockImplementation((selector) => selector(store));
}

function todayMinusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_SESSIONS = [
  { date: '2026-04-19', duration: 30, timestamp: 1745020800000 },
  { date: '2026-04-30', duration: 10, timestamp: 1746057600000 },
  { date: '2026-05-02', duration: 15, timestamp: 1746230400000 },
];

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setStore({
      sessions: DEFAULT_SESSIONS,
      streak: { current: 14, longest: 31 },
    });
  });

  it('renders header, hero, secondary stats, chart card with tabs, and recent sessions card', () => {
    const { getByText, getByLabelText, getByTestId } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    expect(getByText('Your Practice')).toBeTruthy();

    // Hero
    expect(getByText('14')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();

    // Secondary stats
    expect(getByTestId('stat-longest')).toBeTruthy();
    expect(getByTestId('stat-total')).toBeTruthy();
    expect(getByText('Longest streak')).toBeTruthy();
    expect(getByText('Total sessions')).toBeTruthy();

    // Chart card + tabs
    expect(getByTestId('chart-card')).toBeTruthy();
    expect(getByLabelText('Days')).toBeTruthy();
    expect(getByLabelText('Weeks')).toBeTruthy();
    expect(getByLabelText('Months')).toBeTruthy();
    expect(getByLabelText('All Time')).toBeTruthy();
    expect(getByText('TIME PER DAY')).toBeTruthy();
    expect(getByText('today')).toBeTruthy();

    // Recent sessions
    expect(getByText('RECENT SESSIONS')).toBeTruthy();
    expect(getByText(`${DEFAULT_SESSIONS.length} sessions`)).toBeTruthy();
  });

  it('hero shows seeded streak.current', () => {
    setStore({
      sessions: DEFAULT_SESSIONS,
      streak: { current: 14, longest: 31 },
    });
    const { getByText } = render(<StatsScreen navigation={mockNavigation} />);
    expect(getByText('14')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();
  });

  it('mini-week strip marks days with sessions as active', () => {
    // Active dots: today (i=6), 2 days ago (i=4)
    setStore({
      sessions: [
        { date: todayMinusDays(0), duration: 10, timestamp: Date.now() },
        { date: todayMinusDays(2), duration: 15, timestamp: Date.now() - 2 * 86400000 },
      ],
      streak: { current: 1, longest: 1 },
    });
    const { getByTestId, queryByTestId } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    expect(getByTestId('mini-week-dot-6-active')).toBeTruthy();
    expect(getByTestId('mini-week-dot-4-active')).toBeTruthy();
    expect(queryByTestId('mini-week-dot-0-active')).toBeNull();
    expect(getByTestId('mini-week-dot-0-inactive')).toBeTruthy();
    expect(getByTestId('mini-week-dot-3-inactive')).toBeTruthy();
    expect(getByTestId('mini-week-dot-5-inactive')).toBeTruthy();
  });

  it('switching tabs updates the uppercase label and suffix and swaps chart body', () => {
    const { getByLabelText, getByText, queryByText, getByTestId, queryByTestId } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    // Default tab Days
    expect(getByText('TIME PER DAY')).toBeTruthy();
    expect(getByText('today')).toBeTruthy();
    expect(getByTestId('bar-chart')).toBeTruthy();

    fireEvent.press(getByLabelText('Weeks'));
    expect(getByText('TIME PER WEEK')).toBeTruthy();
    expect(getByText('this week')).toBeTruthy();
    expect(queryByText('TIME PER DAY')).toBeNull();

    fireEvent.press(getByLabelText('Months'));
    expect(getByText('TIME PER MONTH')).toBeTruthy();
    expect(getByText('this month')).toBeTruthy();

    fireEvent.press(getByLabelText('All Time'));
    expect(getByText('ALL TIME')).toBeTruthy();
    expect(getByText('total')).toBeTruthy();
    expect(queryByTestId('bar-chart')).toBeNull();
    expect(getByTestId('area-chart')).toBeTruthy();
  });

  it('hides the average dashed line when no sessions exist', () => {
    setStore({ sessions: [], streak: { current: 0, longest: 0 } });
    const { queryByTestId } = render(<StatsScreen navigation={mockNavigation} />);
    expect(queryByTestId('avg-line')).toBeNull();
  });

  it('renders one row per session and caps at 10', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      duration: 10 + i,
      timestamp: 1746000000000 + i * 86400000,
    }));
    setStore({ sessions: many, streak: { current: 1, longest: 1 } });

    const { getAllByTestId, getByText } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    expect(getAllByTestId('session-row').length).toBe(10);
    expect(getByText('10 sessions')).toBeTruthy();
  });

  it('pressing back arrow calls navigation.goBack', () => {
    const { getByLabelText } = render(<StatsScreen navigation={mockNavigation} />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
