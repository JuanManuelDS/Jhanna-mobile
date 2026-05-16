const { withAndroidManifest, withDangerousMod, withProjectBuildGradle } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const BELL_FILES = ['Aguda.wav', 'Grave.wav', 'Larga.mp3', 'Media.wav', 'Suave.mp3'];

const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
  'android.permission.SCHEDULE_EXACT_ALARM',
];

function withForegroundServicePermissions(config) {
  return withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;

    if (!manifest['uses-permission']) manifest['uses-permission'] = [];

    for (const perm of PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) application.service = [];

      // Notifee ForegroundService — must declare foregroundServiceType
      const FG_SERVICE = 'app.notifee.core.ForegroundService';
      const serviceExists = application.service.some(
        (s) => s.$?.['android:name'] === FG_SERVICE
      );
      if (!serviceExists) {
        application.service.push({
          $: {
            'android:name': FG_SERVICE,
            'android:foregroundServiceType': 'mediaPlayback',
            'android:exported': 'false',
          },
        });
      }
    }

    return mod;
  });
}

function withBellSoundsInResRaw(config) {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const resRawDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app/src/main/res/raw'
      );
      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }

      const bellsDir = path.join(mod.modRequest.projectRoot, 'assets/bells');

      for (const file of BELL_FILES) {
        const src = path.join(bellsDir, file);
        const dest = path.join(resRawDir, file.toLowerCase());
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      return mod;
    },
  ]);
}

function withNotifeeLocalMaven(config) {
  return withProjectBuildGradle(config, (mod) => {
    const tag = 'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';
    if (!mod.modResults.contents.includes(tag)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        `maven { url 'https://www.jitpack.io' }\n    ${tag}`
      );
    }
    return mod;
  });
}

module.exports = function withForegroundService(config) {
  config = withForegroundServicePermissions(config);
  config = withBellSoundsInResRaw(config);
  config = withNotifeeLocalMaven(config);
  return config;
};
