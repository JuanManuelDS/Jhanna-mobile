import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import AppNavigator from './src/navigation/AppNavigator';
import useAppStore from './src/store/useAppStore';

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });

  useEffect(() => {
    hydrate();
  }, []);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
