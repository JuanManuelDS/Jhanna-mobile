import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import StatsScreen from '../src/screens/StatsScreen';
import { ALL_BAR_DATA, SESSIONS } from '../src/utils/statsMockData';
import { calcChartVars } from '../src/utils/statsMockData';

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

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders stat cards, chart section, and sessions list', () => {
    const { getByText } = render(<StatsScreen navigation={mockNavigation} />);

    expect(getByText('My Statistics')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();
    expect(getByText('31')).toBeTruthy();
    expect(getByText('87')).toBeTruthy();
    expect(getByText('Daily Minutes')).toBeTruthy();
    expect(getByText('Past Sessions')).toBeTruthy();
  });

  it('defaults to Last 14 days and updates legend avg when range changes', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <StatsScreen navigation={mockNavigation} />
    );

    const { avg: avg14 } = calcChartVars(ALL_BAR_DATA['14d']);
    expect(getByText(`Daily avg (${avg14} min)`)).toBeTruthy();

    fireEvent.press(getByLabelText('Range selector'));
    fireEvent.press(getByLabelText('Last 7 days'));

    const { avg: avg7 } = calcChartVars(ALL_BAR_DATA['7d']);
    expect(getByText(`Daily avg (${avg7} min)`)).toBeTruthy();
    expect(queryByText(`Daily avg (${avg14} min)`)).toBeNull();
  });

  it('renders one row per session with correct type, date/time, and duration', () => {
    const { getByText, getAllByText } = render(<StatsScreen navigation={mockNavigation} />);

    SESSIONS.forEach((s) => {
      // type may appear in multiple rows; verify at least one instance exists
      expect(getAllByText(s.type).length).toBeGreaterThanOrEqual(1);
      // date·time and duration are unique per session
      expect(getByText(`${s.date} · ${s.time}`)).toBeTruthy();
      expect(getByText(s.duration)).toBeTruthy();
    });
  });

  it('pressing back arrow calls navigation.goBack', () => {
    const { getByLabelText } = render(<StatsScreen navigation={mockNavigation} />);

    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
