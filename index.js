import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';

// Notifee requires the foreground service task and background event handler to be
// registered at the module level (outside any React component).

// Keeps the Android foreground service alive for the duration of the session.
// The service is stopped explicitly by sessionService.stop() via notifee.stopForegroundService().
notifee.registerForegroundService(() => new Promise(() => {}));

// Handles notification interactions while the app is fully background/killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (
    type === EventType.PRESS &&
    (detail.notification?.id === 'bell-prep' ||
      detail.notification?.id === 'bell-end')
  ) {
    // Dismiss the bell notification; app will open to wherever it currently is.
    await notifee.cancelNotification(detail.notification.id).catch(() => {});
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(App);
