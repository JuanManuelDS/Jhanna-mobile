import { View, Text } from 'react-native';
import FlameBadge from './FlameBadge';
import MiniWeekStrip from './MiniWeekStrip';

const GLASS_BG = 'rgba(255, 248, 240, 0.8)';
const GLASS_BORDER = 'rgba(200, 169, 110, 0.25)';
const BROWN = '#A0654A';
const SAND = '#C8A96E';

export default function StreakHero({ streak, sessions }) {
  const current = streak?.current ?? 0;
  const numeralSize = current >= 1000 ? 32 : 38;

  return (
    <View
      style={{
        backgroundColor: GLASS_BG,
        borderColor: GLASS_BORDER,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <FlameBadge />

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text
            style={{
              fontFamily: 'DMSerifDisplay_400Regular',
              fontSize: numeralSize,
              lineHeight: numeralSize,
              color: BROWN,
              letterSpacing: -1,
            }}
          >
            {current}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: SAND,
            }}
          >
            day streak
          </Text>
        </View>
      </View>

      <MiniWeekStrip sessions={sessions} />
    </View>
  );
}
