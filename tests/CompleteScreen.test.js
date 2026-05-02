import { render, fireEvent } from '@testing-library/react-native';
import CompleteScreen from '../src/screens/CompleteScreen';

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

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

const makeNav = () => ({ reset: jest.fn(), navigate: jest.fn() });
const makeRoute = (params = {}) => ({ params });

const validParams = {
  duration: 10,
  streakCount: 5,
  date: new Date(2026, 3, 26).toISOString(),
};

describe('CompleteScreen', () => {
  it('renders without crashing with valid params', () => {
    const { toJSON } = render(
      <CompleteScreen navigation={makeNav()} route={makeRoute(validParams)} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the duration row as `${duration} min`', () => {
    const { getByText } = render(
      <CompleteScreen navigation={makeNav()} route={makeRoute(validParams)} />
    );
    expect(getByText('10 min')).toBeTruthy();
  });

  it('renders the date row formatted with weekday + month + day', () => {
    const { getByText } = render(
      <CompleteScreen navigation={makeNav()} route={makeRoute(validParams)} />
    );
    expect(getByText('Sunday, April 26')).toBeTruthy();
  });

  it('renders the streak row as `${streakCount} consecutive days`', () => {
    const { getByText } = render(
      <CompleteScreen navigation={makeNav()} route={makeRoute(validParams)} />
    );
    expect(getByText('5 consecutive days')).toBeTruthy();
  });

  it('falls back to `1 consecutive days` when streakCount is missing', () => {
    const { getByText } = render(
      <CompleteScreen
        navigation={makeNav()}
        route={makeRoute({ duration: 10, date: validParams.date })}
      />
    );
    expect(getByText('1 consecutive days')).toBeTruthy();
  });

  it('Return Home resets the nav stack to Home', () => {
    const nav = makeNav();
    const { getByLabelText } = render(
      <CompleteScreen navigation={nav} route={makeRoute(validParams)} />
    );
    fireEvent.press(getByLabelText('Return Home'));
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });

  it('View Statistics navigates to the Statistics route', () => {
    const nav = makeNav();
    const { getByLabelText } = render(
      <CompleteScreen navigation={nav} route={makeRoute(validParams)} />
    );
    fireEvent.press(getByLabelText('View Statistics'));
    expect(nav.navigate).toHaveBeenCalledWith('Statistics');
  });

  it('falls back gracefully when date is omitted', () => {
    const { getByTestId } = render(
      <CompleteScreen
        navigation={makeNav()}
        route={makeRoute({ duration: 10, streakCount: 3 })}
      />
    );
    const dateValue = getByTestId('date-value');
    expect(dateValue.props.children).toBeTruthy();
    expect(typeof dateValue.props.children).toBe('string');
    expect(dateValue.props.children.length).toBeGreaterThan(0);
  });
});
