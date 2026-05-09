import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatCard from '../components/StatCard';
import StatsTabs from '../components/StatsTabs';
import BarChart from '../components/BarChart';
import AreaChart from '../components/AreaChart';
import ChartLegend from '../components/ChartLegend';
import SessionRow from '../components/SessionRow';
import useAppStore from '../store/useAppStore';
import {
  getDailyBuckets,
  getWeeklyBuckets,
  getMonthlyBuckets,
  getCumulativeSeries,
  formatMins,
} from '../utils/chartData';
import { todayLocalISO } from '../utils/date';

const SESSION_CAP = 10;

const CHART_TITLES = {
  days: 'Time per Day',
  weeks: 'Time per Week',
  months: 'Time per Month',
  all: 'All Time',
};

const CURRENT_LABELS = {
  days: 'today',
  weeks: 'this week',
  months: 'this month',
};

export default function StatsScreen({ navigation }) {
  const [tab, setTab] = useState('days');
  const sessions = useAppStore((s) => s.sessions);
  const streak = useAppStore((s) => s.streak);

  const today = todayLocalISO();

  const { chartData, currentVal, avg, totalAllTime } = useMemo(() => {
    if (tab === 'days') {
      const data = getDailyBuckets(sessions, today, 14);
      return computeBarStats(data);
    }
    if (tab === 'weeks') {
      const data = getWeeklyBuckets(sessions, today, 14);
      return computeBarStats(data);
    }
    if (tab === 'months') {
      const data = getMonthlyBuckets(sessions, today, 12);
      return computeBarStats(data);
    }
    const data = getCumulativeSeries(sessions, today, 12);
    const total = sessions.reduce((sum, s) => sum + s.duration, 0);
    return { chartData: data, currentVal: 0, avg: 0, totalAllTime: total };
  }, [tab, sessions, today]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, SESSION_CAP),
    [sessions]
  );

  const isAllTime = tab === 'all';

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

        {/* Tabs */}
        <StatsTabs value={tab} onChange={setTab} />

        {/* Chart card */}
        <View className="mb-5 mt-4 rounded-2xl bg-card px-3 pb-2.5 pt-3.5">
          <View className="mb-2.5">
            <Text className="mb-0.5 font-sans-semibold text-[13px] text-brown">
              {CHART_TITLES[tab]}
            </Text>
            {!isAllTime ? (
              <View className="flex-row items-baseline">
                <Text className="font-sans-semibold text-xs text-brown">
                  {formatMins(currentVal)} {CURRENT_LABELS[tab]}
                </Text>
                <Text className="ml-2 font-sans text-[10px]" style={{ color: '#B8956A' }}>
                  Avg: {formatMins(avg)}
                </Text>
              </View>
            ) : (
              <Text className="font-sans-semibold text-xs text-brown">
                Total: {formatMins(totalAllTime)}
              </Text>
            )}
          </View>

          {isAllTime ? <AreaChart data={chartData} /> : <BarChart data={chartData} />}

          <ChartLegend mode={isAllTime ? 'area' : 'bar'} avg={avg} />
        </View>

        {/* Past sessions */}
        <View>
          <View className="mb-2.5 flex-row items-baseline justify-between">
            <Text className="font-sans-semibold text-sm text-brown">Past Sessions</Text>
            <Text className="font-sans text-[10px]" style={{ color: '#B8956A' }}>
              {sortedSessions.length} recent
            </Text>
          </View>
          {sortedSessions.map((s) => (
            <SessionRow key={s.timestamp} session={s} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function computeBarStats(data) {
  const currentVal = data.length ? data[data.length - 1].mins : 0;
  const nonZero = data.filter((d) => d.mins > 0);
  const avg = nonZero.length
    ? Math.round(nonZero.reduce((s, d) => s + d.mins, 0) / nonZero.length)
    : 0;
  return { chartData: data, currentVal, avg, totalAllTime: 0 };
}
