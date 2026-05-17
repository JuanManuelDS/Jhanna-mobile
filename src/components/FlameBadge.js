import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SIZE = 60;
const ICON = 28;
const TERRACOTTA = '#E8936A';
const GOLD = '#D4B856';

export default function FlameBadge() {
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="image"
      accessibilityLabel="Streak flame"
    >
      <Svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient
            id="flameBadgeGrad"
            cx="0.4"
            cy="0.4"
            r="0.7"
            fx="0.4"
            fy="0.4"
          >
            <Stop offset="0%" stopColor={TERRACOTTA} stopOpacity={0.2} />
            <Stop offset="70%" stopColor={GOLD} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 0.5}
          fill="url(#flameBadgeGrad)"
          stroke={TERRACOTTA}
          strokeOpacity={0.2}
          strokeWidth={1}
        />
      </Svg>
      <MaterialCommunityIcons name="fire" size={ICON} color={TERRACOTTA} />
    </View>
  );
}
