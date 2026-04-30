jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const AnimatedView = React.forwardRef((props, ref) =>
    React.createElement(View, { ref, ...props })
  );
  AnimatedView.displayName = 'Animated.View';

  return {
    __esModule: true,
    default: { View: AnimatedView, createAnimatedComponent: (C) => C },
    View: AnimatedView,
    createAnimatedComponent: (C) => C,
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withRepeat: (v) => v,
    withTiming: (v) => v,
    withDelay: (_d, v) => v,
    Easing: { inOut: () => () => 0, ease: () => 0 },
  };
});

jest.mock('expo-font', () => ({
  useFonts: () => [true],
  isLoaded: () => true,
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props) =>
    React.createElement(View, { accessibilityLabel: props.name, ...props });
  return {
    MaterialCommunityIcons: Icon,
    Ionicons: Icon,
  };
});
