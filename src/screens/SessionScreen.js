import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { phaseAt } from '../utils/timer';
import { useBells } from '../hooks/useBells';
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
  } = route.params ?? {};
  const prepSec = typeof prepSeconds === 'number'
    ? prepSeconds
    : (prepTime ?? 1) * 60;
  const medSec = meditationTime * 60;

  const commitCompletedSession = useAppStore((s) => s.commitCompletedSession);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [phaseKey, setPhaseKey] = useState(0);

  const intervalRef = useRef(null);
  const completedRef = useRef(false);
  const endingRef = useRef(false);
  const wasPausedBeforeStopRef = useRef(false);

  const { playStartBell, playEndBell } = useBells({ startBell, endBell });

  const { phase, remainingSeconds } = phaseAt(prepSec, medSec, elapsedSec);

  const phaseDurationSec = phase === 'preparation' ? prepSec : medSec;

  const ringBell = useCallback(() => {
    setRinging(true);
    setTimeout(() => setRinging(false), 750);
  }, []);

  useEffect(() => {
    if (isPaused || completedRef.current) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedSec((e) => e + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'complete' && !completedRef.current) {
      completedRef.current = true;
      clearInterval(intervalRef.current);
      ringBell();
      playEndBell();

      commitCompletedSession({ durationMinutes: meditationTime }).then((result) => {
        navigation.replace('Complete', {
          duration: result.duration,
          streakCount: result.streak.current,
          date: new Date().toISOString(),
        });
      });
      return;
    }

    if (prev === 'preparation' && phase === 'meditation') {
      ringBell();
      playStartBell();
      setPhaseKey((k) => k + 1);
    }
  }, [phase]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (stopModalVisible) {
          setStopModalVisible(false);
          if (!wasPausedBeforeStopRef.current) setIsPaused(false);
        } else {
          wasPausedBeforeStopRef.current = isPaused;
          setIsPaused(true);
          setStopModalVisible(true);
        }
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [stopModalVisible, isPaused])
  );

  const handlePauseResume = () => {
    setIsPaused((p) => !p);
  };

  const handleStop = () => {
    wasPausedBeforeStopRef.current = isPaused;
    setIsPaused(true);
    setStopModalVisible(true);
  };

  const handleContinue = () => {
    setStopModalVisible(false);
    if (!wasPausedBeforeStopRef.current) {
      setIsPaused(false);
    }
  };

  const handleEndSession = () => {
    if (endingRef.current) return;
    endingRef.current = true;

    clearInterval(intervalRef.current);

    const meditatedSec = Math.max(0, elapsedSec - prepSec);
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

    // Stopped during prep with no meditation time — nothing to save
    setStopModalVisible(false);
    navigation.popToTop();
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  if (medSec === 0) {
    navigation.popToTop();
    return null;
  }

  return (
    <View style={styles.screen}>
      <PhaseLabel phase={phase === 'complete' ? 'meditation' : phase} ringing={ringing} phaseKey={phaseKey} />

      <View style={styles.timerWrapper}>
        <CircularTimer
          phaseDurationSec={phaseDurationSec}
          remainingSec={remainingSeconds}
          isPaused={isPaused}
          phaseKey={phaseKey}
        />
      </View>

      <PhaseDots activePhase={phase === 'complete' ? 'meditation' : phase} />

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
