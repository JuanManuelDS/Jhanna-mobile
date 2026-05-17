import { View, Text } from 'react-native';
import SessionRow from './SessionRow';

const GLASS_BG = 'rgba(255, 248, 240, 0.8)';
const GLASS_BORDER = 'rgba(200, 169, 110, 0.25)';
const SAND = '#C8A96E';

export default function RecentSessionsCard({ sessions }) {
  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: GLASS_BG,
        borderColor: GLASS_BORDER,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 4,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingTop: 14,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_500Medium',
            fontSize: 10,
            color: SAND,
            letterSpacing: 0.8,
          }}
        >
          RECENT SESSIONS
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 11,
            color: SAND,
          }}
        >
          {sessions.length} sessions
        </Text>
      </View>

      {sessions.map((s, i) => (
        <SessionRow
          key={s.timestamp}
          session={s}
          isLast={i === sessions.length - 1}
        />
      ))}
    </View>
  );
}
