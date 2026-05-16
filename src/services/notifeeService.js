import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  EventType,
} from '@notifee/react-native';

const FG_CHANNEL_ID = 'meditation-session';
const SESSION_NOTIF_ID = 'meditation-session';

// Maps bell name (from bells.js) to the res/raw sound filename (without extension)
const BELL_SOUND_MAP = {
  Aguda: 'aguda',
  Grave: 'grave',
  Larga: 'larga',
  Media: 'media',
  Suave: 'suave',
};

function bellChannelId(bellName) {
  return `bell-${bellName.toLowerCase()}`;
}

export async function setupChannels() {
  // Silent low-importance channel for the sticky session notification
  await notifee.createChannel({
    id: FG_CHANNEL_ID,
    name: 'Meditation Session',
    importance: AndroidImportance.LOW,
    vibration: false,
    sound: '',
  });

  // High-importance bell channel for each sound (custom sound, bypass DND)
  for (const [name, sound] of Object.entries(BELL_SOUND_MAP)) {
    await notifee.createChannel({
      id: bellChannelId(name),
      name: `Bell – ${name}`,
      importance: AndroidImportance.HIGH,
      sound,
      vibration: true,
      bypassDnd: true,
    });
  }
}

export async function requestPermission() {
  return notifee.requestPermission();
}

async function displaySessionNotification(body) {
  await notifee.displayNotification({
    id: SESSION_NOTIF_ID,
    title: 'Jhanna',
    body,
    android: {
      channelId: FG_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default', launchActivity: 'default' },
      visibility: AndroidVisibility.PUBLIC,
    },
  });
}

export function startForegroundSession(body) {
  return displaySessionNotification(body);
}

export function updateForegroundSession(body) {
  return displaySessionNotification(body);
}

export async function scheduleBell({ notifId, title, body, timestamp, bellName }) {
  const channelId = bellChannelId(bellName);
  await notifee.createTriggerNotification(
    {
      id: notifId,
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default', launchActivity: 'default' },
        autoCancel: true,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: { allowWhileIdle: true },
    }
  );
}

export function cancelTriggerNotification(id) {
  return notifee.cancelTriggerNotification(id).catch(() => {});
}

export function cancelNotification(id) {
  return notifee.cancelNotification(id).catch(() => {});
}

export async function stopForeground() {
  await notifee.stopForegroundService().catch(() => {});
  await notifee.cancelNotification(SESSION_NOTIF_ID).catch(() => {});
}

export function getPowerManagerInfo() {
  return notifee.getPowerManagerInfo();
}

export function openPowerManagerSettings() {
  return notifee.openPowerManagerSettings();
}

// Call once from the component tree to handle bell notifications while app is foreground
// (cancel OS sound since useBells handles it in-app)
export function registerForegroundEventHandler() {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (
      type === EventType.DELIVERED &&
      (detail.notification?.id === 'bell-prep' ||
        detail.notification?.id === 'bell-end')
    ) {
      notifee.cancelNotification(detail.notification.id).catch(() => {});
    }
  });
}
