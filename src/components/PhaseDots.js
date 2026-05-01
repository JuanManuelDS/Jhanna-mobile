import { View, StyleSheet } from 'react-native';

export default function PhaseDots({ activePhase }) {
  const phases = ['preparation', 'meditation'];
  return (
    <View style={styles.row}>
      {phases.map((p) => {
        const isActive = p === activePhase;
        return (
          <View
            key={p}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#D4B856',
    opacity: 0.9,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#A0654A',
    opacity: 0.25,
  },
});
