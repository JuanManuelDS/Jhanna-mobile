import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StreakBadge from '../components/StreakBadge';
import StatsButton from '../components/StatsButton';
import BreathingOrb from '../components/BreathingOrb';
import EditableTimePickerCard from '../components/EditableTimePickerCard';
import BeginButton from '../components/BeginButton';
import TabBar from '../components/TabBar';
import BellSelect from '../components/BellSelect';
import PredefinedMeditationCard from '../components/PredefinedMeditationCard';
import { getGreeting } from '../utils/greeting';
import {
  PREDEFINED_MEDITATIONS,
  PREDEFINED_KIND,
  getPredefinedById,
  getPredefinedAudioDurationMs,
  computeAudioStartOffsetSec,
} from '../utils/predefinedMeditations';
import useAppStore from '../store/useAppStore';

const PREP_MIN = 5;
const PREP_MAX = 600;
const PREP_STEP = 10;
const MED_MIN = 1;
const MED_MAX = 240;
const MED_STEP = 1;

const TABS = [
  { value: 'manual', label: 'Manual' },
  { value: 'predefined', label: 'Predefined' },
];

export default function HomeScreen({ navigation }) {
  const greeting = getGreeting(new Date().getHours());
  const streak = useAppStore((s) => s.streak);
  const settings = useAppStore((s) => s.settings);
  const sessionDefaults = useAppStore((s) => s.sessionDefaults);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateSessionDefaults = useAppStore((s) => s.updateSessionDefaults);

  const [activeTab, setActiveTab] = useState('manual');
  const [selectedPredefId, setSelectedPredefId] = useState(() => {
    const persisted = sessionDefaults?.lastPredefinedId ?? null;
    return getPredefinedById(persisted) ? persisted : null;
  });
  const [shortInstrAudioMs, setShortInstrAudioMs] = useState(null);
  const beginningRef = useRef(false);

  // Drop a stale persisted lastPredefinedId so it does not stick around in storage.
  useEffect(() => {
    const persisted = sessionDefaults?.lastPredefinedId ?? null;
    if (persisted != null && !getPredefinedById(persisted)) {
      updateSessionDefaults({ lastPredefinedId: null });
    }
    // Run once on mount; we only care about the value we hydrated from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazily preload Short Instructions audio duration when user opens Predefined tab.
  useEffect(() => {
    if (activeTab !== 'predefined') return;
    if (shortInstrAudioMs != null) return;
    let cancelled = false;
    getPredefinedAudioDurationMs('short-instructions').then((ms) => {
      if (!cancelled && ms != null) setShortInstrAudioMs(ms);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, shortInstrAudioMs]);

  const prepSeconds = settings.prepSeconds;
  const meditationTime = settings.meditationTime;
  const startBell = settings.startBell;
  const endBell = settings.endBell;

  const setPrepSeconds = (next) => updateSettings({ prepSeconds: next });
  const setMeditationTime = (next) => updateSettings({ meditationTime: next });
  const setStartBell = (next) => updateSettings({ startBell: next });
  const setEndBell = (next) => updateSettings({ endBell: next });

  const handleSelectPredef = (med) => {
    const next = med.id === selectedPredefId ? null : med.id;
    setSelectedPredefId(next);
    updateSessionDefaults({ lastPredefinedId: next });
  };

  const isReady = activeTab === 'manual' || selectedPredefId != null;

  const cards = useMemo(
    () =>
      PREDEFINED_MEDITATIONS.map((m) => {
        if (m.kind === PREDEFINED_KIND.SHORT_INSTRUCTIONS && m.meditationTime == null) {
          const minutes = shortInstrAudioMs != null
            ? Math.max(1, Math.ceil(shortInstrAudioMs / 60000))
            : null;
          return { ...m, meditationTime: minutes };
        }
        return m;
      }),
    [shortInstrAudioMs]
  );

  const handleBegin = async () => {
    if (!isReady) return;
    if (beginningRef.current) return;

    if (activeTab === 'predefined') {
      beginningRef.current = true;
      try {
        const m = getPredefinedById(selectedPredefId);
        if (!m) return;
        const isShort = m.kind === PREDEFINED_KIND.SHORT_INSTRUCTIONS;
        const audioMs = await getPredefinedAudioDurationMs(m.id);
        const audioSec = audioMs ? Math.round(audioMs / 1000) : null;

        // For Short Instructions the meditation length IS the audio length.
        // If we can't read it, don't silently start a 1-minute session.
        if (isShort && !audioMs) {
          Alert.alert(
            'Audio unavailable',
            'Could not read the meditation audio duration. Please try again.'
          );
          return;
        }

        const meditationMinutes = isShort
          ? Math.max(1, Math.ceil(audioMs / 60000))
          : 60;

        navigation.navigate('Session', {
          prepSeconds: m.prepTime,
          meditationTime: meditationMinutes,
          predefined: {
            id: m.id,
            kind: m.kind,
            audio: m.audio,
            audioDurationSec: audioSec,
            audioStartOffsetSec: computeAudioStartOffsetSec(m.kind, audioSec ?? 0),
            endsWithAudio: isShort,
          },
        });
      } finally {
        beginningRef.current = false;
      }
      return;
    }

    navigation.navigate('Session', {
      prepSeconds,
      meditationTime,
      startBell,
      endBell,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <StreakBadge count={streak.current} />
        <StatsButton onPress={() => navigation.navigate('Stats')} />
      </View>

      <View className="flex-1 items-center justify-center gap-1.5 px-7">
        <BreathingOrb />
        <View className="my-1 h-px w-10 bg-sand/40" />
        <Text className="text-center font-serif text-[24px] leading-[28px] text-brown">
          {greeting}
          {'\n'}
          <Text className="font-serif-italic text-terracotta">be still.</Text>
        </Text>
        <Text className="text-center font-sans text-xs tracking-[0.3px] text-sand">
          Your practice awaits
        </Text>
      </View>

      <View className="px-5">
        <View
          className="overflow-hidden rounded-[20px] border border-sand/20 bg-offwhite/80"
          style={{ height: 290 }}
        >
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {activeTab === 'manual' ? (
            <View className="flex-1 gap-2 px-3.5 pb-3.5 pt-3">
              <EditableTimePickerCard
                label="Preparation"
                sublabel="Settle into stillness"
                value={prepSeconds}
                min={PREP_MIN}
                max={PREP_MAX}
                step={PREP_STEP}
                unit="sec"
                formatDisplay={(v) => String(v)}
                formatEditing={(v) => String(v)}
                onChange={setPrepSeconds}
                testID="prep-picker"
              />
              <EditableTimePickerCard
                label="Meditation"
                sublabel="Jhanna practice"
                value={meditationTime}
                min={MED_MIN}
                max={MED_MAX}
                step={MED_STEP}
                unit="min"
                formatDisplay={(v) => String(v)}
                formatEditing={(v) => String(v)}
                onChange={setMeditationTime}
                testID="meditation-picker"
              />
              <View className="flex-row gap-2.5">
                <BellSelect label="Beginning bell" value={startBell} onChange={setStartBell} />
                <BellSelect label="Finishing bell" value={endBell} onChange={setEndBell} />
              </View>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {cards.map((m) => (
                <PredefinedMeditationCard
                  key={m.id}
                  meditation={m}
                  selected={m.id === selectedPredefId}
                  onPress={handleSelectPredef}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <View className="px-5 pb-7 pt-4">
        <BeginButton onPress={handleBegin} disabled={!isReady} />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
