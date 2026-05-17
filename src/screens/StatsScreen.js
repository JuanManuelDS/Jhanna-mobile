import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import StreakHero from '../components/StreakHero';
import SecondaryStats from '../components/SecondaryStats';
import TabNav from '../components/TabNav';
import BarChart from '../components/BarChart';
import AreaChart from '../components/AreaChart';
import RecentSessionsCard from '../components/RecentSessionsCard';
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
const BROWN = '#A0654A';
const SAND = '#C8A96E';
const GLASS_BG = 'rgba(255, 248, 240, 0.8)';
const GLASS_BORDER = 'rgba(200, 169, 110, 0.25)';
const BACK_BG = 'rgba(160, 101, 74, 0.1)';

const CHART_LABELS = {
  days: 'TIME PER DAY',
  weeks: 'TIME PER WEEK',
  months: 'TIME PER MONTH',
  all: 'ALL TIME',
};

const CURRENT_SUFFIX = {
  days: 'today',
  weeks: 'this week',
  months: 'this month',
};

function BackIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l6-6M5 12l6 6"
        stroke={BROWN}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function StatsScreen({ navigation }) {
  const [tab, setTab] = useState('days');
  const sessions = useAppStore((s) => s.sessions);
  const streak = useAppStore((s) => s.streak);

  const today = todayLocalISO();

  const { chartData, currentVal, totalAllTime } = useMemo(() => {
    if (tab === 'days') {
      const data = getDailyBuckets(sessions, today, 14);
      return {
        chartData: data,
        currentVal: data.length ? data[data.length - 1].mins : 0,
        totalAllTime: 0,
      };
    }
    if (tab === 'weeks') {
      const data = getWeeklyBuckets(sessions, today, 14);
      return {
        chartData: data,
        currentVal: data.length ? data[data.length - 1].mins : 0,
        totalAllTime: 0,
      };
    }
    if (tab === 'months') {
      const data = getMonthlyBuckets(sessions, today, 12);
      return {
        chartData: data,
        currentVal: data.length ? data[data.length - 1].mins : 0,
        totalAllTime: 0,
      };
    }
    const data = getCumulativeSeries(sessions, today, 12);
    const total = sessions.reduce((sum, s) => sum + s.duration, 0);
    return { chartData: data, currentVal: 0, totalAllTime: total };
  }, [tab, sessions, today]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, SESSION_CAP),
    [sessions]
  );

  const isAllTime = tab === 'all';
  const valueText = isAllTime ? formatMins(totalAllTime) : formatMins(currentVal);
  const suffixText = isAllTime ? 'total' : CURRENT_SUFFIX[tab];
  const suffixGap = isAllTime ? 6 : 8;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            paddingTop: 40,
            paddingBottom: 32,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: BACK_BG,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BackIcon />
          </Pressable>
          <Text
            style={{
              marginLeft: 12,
              fontFamily: 'DMSerifDisplay_400Regular',
              fontSize: 22,
              color: BROWN,
              letterSpacing: -0.3,
            }}
          >
            Your Practice
          </Text>
        </View>

        <StreakHero streak={streak} sessions={sessions} />
        <SecondaryStats longest={streak.longest} total={sessions.length} />

        <View
          testID="chart-card"
          style={{
            marginTop: 16,
            backgroundColor: GLASS_BG,
            borderColor: GLASS_BORDER,
            borderWidth: 1,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ paddingHorizontal: 16 }}>
            <TabNav value={tab} onChange={setTab} />
          </View>

          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 }}>
            <View style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 10,
                  color: SAND,
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                {CHART_LABELS[tab]}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontFamily: 'DMSerifDisplay_400Regular',
                    fontSize: 24,
                    lineHeight: 24,
                    color: BROWN,
                  }}
                >
                  {valueText}
                </Text>
                <Text
                  style={{
                    marginLeft: suffixGap,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 11,
                    color: SAND,
                  }}
                >
                  {suffixText}
                </Text>
              </View>
            </View>

            {isAllTime ? <AreaChart data={chartData} /> : <BarChart data={chartData} />}
          </View>
        </View>

        <RecentSessionsCard sessions={sortedSessions} />
      </ScrollView>
    </SafeAreaView>
  );
}
