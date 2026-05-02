import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatCard from '../components/StatCard';
import RangeDropdown from '../components/RangeDropdown';
import DailyMinutesChart from '../components/DailyMinutesChart';
import SessionRow from '../components/SessionRow';
import useAppStore from '../store/useAppStore';
import { getBarChartData } from '../utils/chartData';
import { todayLocalISO } from '../utils/date';

const RANGE_DAYS = { '7d': 7, '14d': 14, '30d': 30, '3m': 91 };

export default function StatsScreen({ navigation }) {
  const [range, setRange] = useState('14d');
  const sessions = useAppStore((s) => s.sessions);
  const streak = useAppStore((s) => s.streak);

  const chartData = getBarChartData(sessions, RANGE_DAYS[range], todayLocalISO());
  const sortedSessions = [...sessions].reverse();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-5 flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="p-1"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#A0654A" />
          </Pressable>
          <Text className="ml-1 font-sans-semibold text-lg text-brown">My Statistics</Text>
        </View>

        {/* Stat cards */}
        <View className="mb-5 flex-row gap-2">
          <StatCard icon="leaf" value={streak.current} label={'Current\nStreak'} />
          <StatCard icon="trophy-outline" value={streak.longest} label={'Longest\nStreak'} />
          <StatCard icon="meditation" value={sessions.length} label={'Total\nSessions'} />
        </View>

        {/* Chart card */}
        <View className="mb-5 rounded-2xl bg-card px-3 pb-2.5 pt-3.5" style={{ zIndex: 1 }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-sans-semibold text-sm text-brown">Daily Minutes</Text>
            <RangeDropdown value={range} onChange={setRange} />
          </View>
          <DailyMinutesChart data={chartData} />
        </View>

        {/* Past sessions */}
        <View>
          <View className="mb-2.5 flex-row items-baseline justify-between">
            <Text className="font-sans-semibold text-sm text-brown">Past Sessions</Text>
            <Text className="font-sans text-xs text-sand">{sessions.length} sessions</Text>
          </View>
          {sortedSessions.map((s) => (
            <SessionRow key={s.timestamp} session={s} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
