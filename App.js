import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Audio, InterruptionModeAndroid } from 'expo-av';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import AppNavigator from './src/navigation/AppNavigator';
import useAppStore from './src/store/useAppStore';
import {
  setupChannels,
  registerForegroundEventHandler,
} from './src/services/notifeeService';

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);

  const [fontsLoaded] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });

  useEffect(() => {
    hydrate();

    // Allow audio to play with silent switch on (iOS) and keep playing in background.
    // On Android, DO_NOT_MIX so our bell takes audio focus when it plays.
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    }).catch((e) => console.warn('setAudioModeAsync failed:', e));

    // Set up Notifee channels (idempotent — safe to call on every launch)
    setupChannels().catch((e) => console.warn('setupChannels failed:', e));
  }, []);

  // Cancel the OS bell sound when the app is in the foreground (useBells handles it)
  useEffect(() => {
    const unsubscribe = registerForegroundEventHandler();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
