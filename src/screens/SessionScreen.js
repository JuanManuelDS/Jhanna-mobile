import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { phaseAt } from '../utils/timer';
import { recordCompletedSession } from '../utils/session';
import { useBells } from '../hooks/useBells';
import CircularTimer from '../components/CircularTimer';
import PhaseLabel from '../components/PhaseLabel';
import PhaseDots from '../components/PhaseDots';
import SessionControls from '../components/SessionControls';

export default function SessionScreen({ route, navigation }) {
  const { prepTime = 1, meditationTime = 10 } = route.params ?? {};
  const prepSec = prepTime * 60;
  const medSec = meditationTime * 60;

  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [phaseKey, setPhaseKey] = useState(0);

  const intervalRef = useRef(null);
  const confirmTimerRef = useRef(null);
  const completedRef = useRef(false);

  const { playStartBell, playEndBell } = useBells();

  const { phase, remainingSeconds } = phaseAt(prepSec, medSec, elapsedSec);

  // Determine phase duration for the arc
  const phaseDurationSec = phase === 'preparation' ? prepSec : medSec;

  const ringBell = useCallback(() => {
    setRinging(true);
    setTimeout(() => setRinging(false), 750);
  }, []);

  // Start/stop the tick interval
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

  // React to phase/completion changes
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'complete' && !completedRef.current) {
      completedRef.current = true;
      clearInterval(intervalRef.current);
      ringBell();
      playEndBell();

      recordCompletedSession({ durationMinutes: meditationTime }).then((result) => {
        navigation.replace('Complete', {
          duration: result.duration,
          streak: result.streak,
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

  // Android hardware back = stop (no save if mid-prep, save meditated time if mid-med)
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        handleStopConfirm();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [elapsedSec, phase])
  );

  const handlePauseResume = () => {
    setIsPaused((p) => !p);
    setConfirmingStop(false);
  };

  const handleStop = () => {
    setIsPaused(true);
    setConfirmingStop(true);
    clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmingStop(false);
      setIsPaused(false);
    }, 3000);
  };

  const handleStopConfirm = () => {
    clearInterval(intervalRef.current);
    clearTimeout(confirmTimerRef.current);

    if (phase === 'meditation' && elapsedSec > prepSec) {
      const meditatedSec = elapsedSec - prepSec;
      const meditatedMinutes = Math.floor(meditatedSec / 60);
      if (meditatedMinutes > 0) {
        recordCompletedSession({ durationMinutes: meditatedMinutes }).then((result) => {
          navigation.replace('Complete', {
            duration: meditatedMinutes,
            streak: result.streak,
          });
        });
        return;
      }
    }

    navigation.popToTop();
  };

  // Cleanup confirm timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(confirmTimerRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  // Skip-prep edge case: if medSec is 0, go home
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
        confirmingStop={confirmingStop}
        onPauseResume={handlePauseResume}
        onStop={handleStop}
        onStopConfirm={handleStopConfirm}
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
