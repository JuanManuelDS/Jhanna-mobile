import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GLASS_BG = 'rgba(255, 248, 240, 0.8)';
const GLASS_BORDER = 'rgba(200, 169, 110, 0.25)';
const BROWN = '#A0654A';
const SAND = '#C8A96E';

function TrophyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h12v3a6 6 0 0 1-12 0V4z"
        stroke={SAND}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3"
        stroke={SAND}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 13v4M9 21h6M10 17h4l1 4H9l1-4z"
        stroke={SAND}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"
        stroke={SAND}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v5l3 2"
        stroke={SAND}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StatCardLite({ Icon, value, label, testID }) {
  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        backgroundColor: GLASS_BG,
        borderColor: GLASS_BORDER,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Icon />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: 'DMSerifDisplay_400Regular',
            fontSize: 22,
            lineHeight: 22,
            color: BROWN,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: 'DMSans_400Regular',
            fontSize: 10,
            color: SAND,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function SecondaryStats({ longest, total }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
      <StatCardLite
        testID="stat-longest"
        Icon={TrophyIcon}
        value={longest}
        label="Longest streak"
      />
      <StatCardLite
        testID="stat-total"
        Icon={ClockIcon}
        value={total}
        label="Total sessions"
      />
    </View>
  );
}
