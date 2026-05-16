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
    useAnimatedProps: () => ({}),
    withRepeat: (_n, v) => v,
    withTiming: (v) => v,
    withDelay: (_d, v) => v,
    withSequence: (...args) => args[args.length - 1],
    cancelAnimation: () => {},
    Easing: { linear: 0, inOut: () => () => 0, ease: () => 0, out: () => 0, cubic: 0 },
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

// In-memory AsyncStorage mock
const _storage = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => Promise.resolve(_storage[key] ?? null)),
  setItem: jest.fn((key, value) => { _storage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key) => { delete _storage[key]; return Promise.resolve(); }),
  clear: jest.fn(() => { Object.keys(_storage).forEach((k) => delete _storage[k]); return Promise.resolve(); }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(_storage))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, _storage[k] ?? null]))),
  multiSet: jest.fn((pairs) => { pairs.forEach(([k, v]) => { _storage[k] = v; }); return Promise.resolve(); }),
}));

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...rest }) => React.createElement(View, rest, children),
  };
});

// @notifee/react-native mock
jest.mock('@notifee/react-native', () => {
  const EventType = { DELIVERED: 0, PRESS: 1, ACTION_PRESS: 2, DISMISSED: 3 };
  const TriggerType = { TIMESTAMP: 0, INTERVAL: 1 };
  const AndroidImportance = { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4 };
  const AndroidVisibility = { PRIVATE: 0, PUBLIC: 1, SECRET: -1 };

  const notifee = {
    createChannel: jest.fn(() => Promise.resolve('channel-id')),
    displayNotification: jest.fn(() => Promise.resolve()),
    createTriggerNotification: jest.fn(() => Promise.resolve()),
    cancelNotification: jest.fn(() => Promise.resolve()),
    cancelTriggerNotification: jest.fn(() => Promise.resolve()),
    stopForegroundService: jest.fn(() => Promise.resolve()),
    registerForegroundService: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    getPowerManagerInfo: jest.fn(() => Promise.resolve({ activity: null })),
    openPowerManagerSettings: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    default: notifee,
    EventType,
    TriggerType,
    AndroidImportance,
    AndroidVisibility,
    InterruptionModeAndroid: { DoNotMix: 1, DuckOthers: 2 },
  };
});

// expo-av mock
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            playAsync: jest.fn(() => Promise.resolve()),
            replayAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            stopAsync: jest.fn(() => Promise.resolve()),
            unloadAsync: jest.fn(() => Promise.resolve()),
            setOnPlaybackStatusUpdate: jest.fn(),
            getStatusAsync: jest.fn(() =>
              Promise.resolve({ isLoaded: true, durationMillis: 7 * 60 * 1000 })
            ),
          },
          status: { durationMillis: 7 * 60 * 1000 },
        })
      ),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));
