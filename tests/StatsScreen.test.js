import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatsScreen from '../src/screens/StatsScreen';
import { calcChartVars, getBarChartData } from '../src/utils/chartData';

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Line: (props) => React.createElement(View, props),
    DashPathEffect: (props) => React.createElement(View, props),
    vec: (x, y) => ({ x, y }),
    useFont: () => null,
    matchFont: () => null,
  };
});

jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CartesianChart: ({ children }) =>
      React.createElement(
        View,
        null,
        typeof children === 'function'
          ? children({
              points: { mins: [] },
              chartBounds: { left: 0, right: 200, top: 0, bottom: 120 },
            })
          : children
      ),
    Bar: (props) => React.createElement(View, props),
    useChartPressState: () => ({ state: {} }),
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

// Apr 19 is 13 days before May 2 (in 14d window, outside 7d window)
// This ensures avg14 ≠ avg7 so the range-switch test is meaningful
const MOCK_SESSIONS = [
  { date: '2026-04-19', duration: 30, timestamp: 1745020800000 },
  { date: '2026-04-30', duration: 10, timestamp: 1746057600000 },
  { date: '2026-05-02', duration: 15, timestamp: 1746230400000 },
];

jest.mock('../src/store/useAppStore', () => {
  const store = {
    sessions: [
      { date: '2026-04-19', duration: 30, timestamp: 1745020800000 },
      { date: '2026-04-30', duration: 10, timestamp: 1746057600000 },
      { date: '2026-05-02', duration: 15, timestamp: 1746230400000 },
    ],
    streak: { current: 14, longest: 31 },
    settings: { prepTime: 1, meditationTime: 10 },
    hydrated: true,
  };
  return { __esModule: true, default: jest.fn((selector) => selector(store)) };
});

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders stat cards, chart section, and sessions list', () => {
    const { getByText } = render(<StatsScreen navigation={mockNavigation} />);

    expect(getByText('My Statistics')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();  // current streak
    expect(getByText('31')).toBeTruthy();  // longest streak
    expect(getByText('3')).toBeTruthy();   // total sessions (3 mock sessions)
    expect(getByText('Daily Minutes')).toBeTruthy();
    expect(getByText('Past Sessions')).toBeTruthy();
  });

  it('defaults to Last 14 days and updates legend avg when range changes', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    const chartData14 = getBarChartData(MOCK_SESSIONS, 14, '2026-05-02');
    const { avg: avg14 } = calcChartVars(chartData14);
    expect(getByText(`Daily avg (${avg14} min)`)).toBeTruthy();

    fireEvent.press(getByLabelText('Range selector'));
    fireEvent.press(getByLabelText('Last 7 days'));

    const chartData7 = getBarChartData(MOCK_SESSIONS, 7, '2026-05-02');
    const { avg: avg7 } = calcChartVars(chartData7);
    expect(getByText(`Daily avg (${avg7} min)`)).toBeTruthy();
    expect(queryByText(`Daily avg (${avg14} min)`)).toBeNull();
  });

  it('renders one session row per stored session', () => {
    const { getAllByText } = render(<StatsScreen navigation={mockNavigation} />);
    // Each session badge is "{duration} min" — 3 sessions = 3 exact matches
    const badges = getAllByText(/^\d+ min$/);
    expect(badges.length).toBe(MOCK_SESSIONS.length);
  });

  it('pressing back arrow calls navigation.goBack', () => {
    const { getByLabelText } = render(<StatsScreen navigation={mockNavigation} />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
