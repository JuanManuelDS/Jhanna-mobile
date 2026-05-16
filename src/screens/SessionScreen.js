import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { phaseAt } from '../utils/timer';
import { useBells } from '../hooks/useBells';
import { usePredefinedAudio } from '../hooks/usePredefinedAudio';
import { useSessionClock } from '../hooks/useSessionClock';
import { NONE_BELL } from '../utils/bells';
import * as sessionService from '../services/sessionService';
import CircularTimer from '../components/CircularTimer';
import PhaseLabel from '../components/PhaseLabel';
import PhaseDots from '../components/PhaseDots';
import SessionControls from '../components/SessionControls';
import StopConfirmModal from '../components/StopConfirmModal';
import useAppStore from '../store/useAppStore';

export default function SessionScreen({ route, navigation }) {
  const {
    prepSeconds,
    prepTime,
    meditationTime = 10,
    startBell,
    endBell,
    predefined,
  } = route.params ?? {};
  const isPredefined = !!predefined;
  const prepSec = typeof prepSeconds === 'number'
    ? prepSeconds
    : (prepTime ?? 1) * 60;
  const medSec = meditationTime * 60;

  const commitCompletedSession = useAppStore((s) => s.commitCompletedSession);

  // Timestamp-anchored elapsed seconds — correct even after screen-off/background
  const elapsedSec = useSessionClock();

  const [isPaused, setIsPaused] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [phaseKey, setPhaseKey] = useState(0);

  const endBellPlayedRef = useRef(false);
  const endingRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const wasPausedBeforeStopRef = useRef(false);

  // For predefined sessions pass NONE_BELL so useBells short-circuits loading
  const { playStartBell, playEndBell } = useBells(
    isPredefined
      ? { startBell: NONE_BELL, endBell: NONE_BELL }
      : { startBell, endBell }
  );

  const { phase, remainingSeconds, overtimeSeconds } = phaseAt(prepSec, medSec, elapsedSec);
  const phaseDurationSec = phase === 'preparation' ? prepSec : medSec;

  const ringBell = useCallback(() => {
    setRinging(true);
    setTimeout(() => setRinging(false), 750);
  }, []);

  // ── Session lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    sessionService
      .start({ prepSec, medSec, bellSound: endBell, isPredefined })
      .catch((e) => console.warn('sessionService.start failed:', e));

    return () => {
      // Safety net: stop if unmounted without going through the user-stop path
      if (!endingRef.current) {
        sessionService.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Phase transitions ──────────────────────────────────────────────────────
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (prev === 'preparation' && phase === 'meditation') {
      if (!isPredefined) {
        ringBell();
        playStartBell();
      }
      sessionService.updatePhase();
      setPhaseKey((k) => k + 1);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End-of-meditation bell (once at the original end mark) ────────────────
  useEffect(() => {
    if (endBellPlayedRef.current) return;
    if (phase !== 'meditation') return;
    if (elapsedSec < prepSec + medSec) return;
    endBellPlayedRef.current = true;
    if (!isPredefined) {
      ringBell();
      playEndBell();
    }
  }, [phase, elapsedSec, prepSec, medSec, isPredefined, ringBell, playEndBell]);

  const medElapsedSec = Math.max(0, elapsedSec - prepSec);
  const inMeditationPhase = phase === 'meditation';

  usePredefinedAudio({
    predefined: isPredefined ? predefined : null,
    isPaused,
    inMeditationPhase,
    medElapsedSec,
  });

  // ── Back-button handler ────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (stopModalVisible) {
          setStopModalVisible(false);
          if (!wasPausedBeforeStopRef.current) {
            sessionService.resume().catch(() => {});
            setIsPaused(false);
          }
        } else {
          wasPausedBeforeStopRef.current = isPaused;
          if (!isPaused) sessionService.pause().catch(() => {});
          setIsPaused(true);
          setStopModalVisible(true);
        }
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [stopModalVisible, isPaused])
  );

  // ── Control handlers ───────────────────────────────────────────────────────
  const handlePauseResume = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (next) {
      sessionService.pause().catch(() => {});
    } else {
      sessionService.resume().catch(() => {});
    }
  };

  const handleStop = () => {
    wasPausedBeforeStopRef.current = isPaused;
    if (!isPaused) sessionService.pause().catch(() => {});
    setIsPaused(true);
    setStopModalVisible(true);
  };

  const handleContinue = () => {
    setStopModalVisible(false);
    if (!wasPausedBeforeStopRef.current) {
      sessionService.resume().catch(() => {});
      setIsPaused(false);
    }
  };

  const handleEndSession = () => {
    if (endingRef.current) return;
    endingRef.current = true;

    const meditatedSec = Math.max(0, elapsedSec - prepSec);
    sessionService.stop().catch(() => {});

    if (meditatedSec > 0) {
      const durationMinutes = Math.max(1, Math.ceil(meditatedSec / 60));
      commitCompletedSession({ durationMinutes }).then((result) => {
        navigation.replace('Complete', {
          duration: durationMinutes,
          streakCount: result.streak.current,
          date: new Date().toISOString(),
        });
      });
      return;
    }

    // Stopped during prep — nothing to save
    setStopModalVisible(false);
    navigation.popToTop();
  };

  if (medSec === 0) {
    navigation.popToTop();
    return null;
  }

  return (
    <View style={styles.screen}>
      <PhaseLabel phase={phase} ringing={ringing} phaseKey={phaseKey} />

      <View style={styles.timerWrapper}>
        <CircularTimer
          phaseDurationSec={phaseDurationSec}
          remainingSec={remainingSeconds}
          overtimeSec={overtimeSeconds}
          isPaused={isPaused}
          phaseKey={phaseKey}
        />
      </View>

      <PhaseDots activePhase={phase} />

      <SessionControls
        isRunning={!isPaused}
        onPauseResume={handlePauseResume}
        onStop={handleStop}
      />

      <StopConfirmModal
        visible={stopModalVisible}
        onConfirm={handleEndSession}
        onCancel={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerWrapper: {
    position: 'relative',
  },
});
