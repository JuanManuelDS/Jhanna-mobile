import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BROWN = '#A0654A';
const SAND = '#C8A96E';
const TERRACOTTA = '#E8936A';
const BADGE_BG = 'rgba(232, 147, 106, 0.1)';
const BADGE_BORDER = 'rgba(232, 147, 106, 0.12)';
const DIVIDER = 'rgba(200, 169, 110, 0.12)';

function ClockGlyph() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"
        stroke={TERRACOTTA}
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v5l3 2"
        stroke={TERRACOTTA}
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function SessionRow({ session, isLast = false }) {
  const d = new Date(session.timestamp);
  const primary = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const secondaryDate = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeOfDay = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View
      testID="session-row"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: DIVIDER,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: BADGE_BG,
          borderWidth: 1,
          borderColor: BADGE_BORDER,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ClockGlyph />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'DMSans_500Medium',
            fontSize: 13,
            color: BROWN,
            marginBottom: 1,
          }}
        >
          {primary}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 11,
            color: SAND,
          }}
        >
          {secondaryDate} · {timeOfDay}
        </Text>
      </View>

      <Text
        style={{
          fontFamily: 'DMSans_500Medium',
          fontSize: 13,
          color: BROWN,
          letterSpacing: -0.2,
          flexShrink: 0,
        }}
      >
        {session.duration} min
      </Text>
    </View>
  );
}
