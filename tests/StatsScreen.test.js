import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatsScreen from '../src/screens/StatsScreen';

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
    Defs: Pass,
    LinearGradient: Pass,
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

  it('renders header, stat cards, four tabs, chart card and sessions list', () => {
    const { getByText, getByLabelText } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    expect(getByText('My Statistics')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();
    expect(getByText('31')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();

    expect(getByLabelText('Days')).toBeTruthy();
    expect(getByLabelText('Weeks')).toBeTruthy();
    expect(getByLabelText('Months')).toBeTruthy();
    expect(getByLabelText('All Time')).toBeTruthy();

    expect(getByText('Time per Day')).toBeTruthy();
    expect(getByText('Past Sessions')).toBeTruthy();
  });

  it('switching tabs swaps the chart-header text without unmounting', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    expect(getByText('Time per Day')).toBeTruthy();

    fireEvent.press(getByLabelText('Weeks'));
    expect(getByText('Time per Week')).toBeTruthy();
    expect(queryByText('Time per Day')).toBeNull();

    fireEvent.press(getByLabelText('Months'));
    expect(getByText('Time per Month')).toBeTruthy();

    fireEvent.press(getByLabelText('All Time'));
    expect(getByText(/^Total: /)).toBeTruthy();
    expect(queryByText('Time per Month')).toBeNull();
  });

  it('renders one session row per stored session (capped) with duration pill', () => {
    const { getAllByText } = render(<StatsScreen navigation={mockNavigation} />);
    const badges = getAllByText(/^\d+ min$/);
    expect(badges.length).toBe(MOCK_SESSIONS.length);
  });

  it('past sessions header shows "{N} recent"', () => {
    const { getByText } = render(<StatsScreen navigation={mockNavigation} />);
    expect(getByText(`${MOCK_SESSIONS.length} recent`)).toBeTruthy();
  });

  it('pressing back arrow calls navigation.goBack', () => {
    const { getByLabelText } = render(<StatsScreen navigation={mockNavigation} />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
