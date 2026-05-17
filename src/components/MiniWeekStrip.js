import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { todayLocalISO } from '../utils/date';

const TERRACOTTA = '#E8936A';
const INACTIVE = 'rgba(200, 169, 110, 0.25)';
const LABEL_COLOR = '#C8A96E';

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MiniWeekStrip({ sessions = [] }) {
  const todayISO = todayLocalISO();

  const days = useMemo(() => {
    const active = new Set(sessions.map((s) => s.date));
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const iso = addDays(todayISO, -i);
      result.push({ iso, isActive: active.has(iso), isToday: iso === todayISO });
    }
    return result;
  }, [sessions, todayISO]);

  return (
    <View style={{ flexShrink: 0, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 2.5 }}>
        {days.map((d, i) => {
          const opacity = !d.isActive ? 1 : d.isToday ? 1 : 0.4 + i * 0.09;
          const color = d.isActive ? TERRACOTTA : INACTIVE;
          return (
            <View
              key={d.iso}
              testID={`mini-week-dot-${i}${d.isActive ? '-active' : '-inactive'}`}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: color,
                opacity,
              }}
            />
          );
        })}
      </View>
      <Text
        style={{
          marginTop: 3,
          fontFamily: 'DMSans_400Regular',
          fontSize: 8,
          color: LABEL_COLOR,
          letterSpacing: 0.5,
        }}
      >
        THIS WEEK
      </Text>
    </View>
  );
}
