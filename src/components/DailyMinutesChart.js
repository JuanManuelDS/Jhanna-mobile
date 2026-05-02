import { View, Text, ScrollView } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { DashPathEffect, Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { calcChartVars } from '../utils/statsMockData';

const CHART_H = 120;
const BAR_W = 14;
const BAR_GAP = 6;

export default function DailyMinutesChart({ data }) {
  const { avg, maxMins } = calcChartVars(data);
  const totalW = data.length * (BAR_W + BAR_GAP) - BAR_GAP;
  const avgY = CHART_H - (avg / maxMins) * CHART_H;

  return (
    <View testID="daily-minutes-chart">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: totalW + 20, height: CHART_H + 32 }}>
          <CartesianChart
            data={data}
            xKey="day"
            yKeys={['mins']}
            domain={{ y: [0, maxMins] }}
            domainPadding={{ left: 10, right: 10 }}
            axisOptions={{ tickCount: { x: 0, y: 0 }, labelColor: 'transparent' }}

          >
            {({ points, chartBounds }) => {
              const avgRatio = maxMins > 0 ? avg / maxMins : 0;
              const lineY = chartBounds.bottom - avgRatio * (chartBounds.bottom - chartBounds.top);
              return (
                <>
                  {/* Dashed average line */}
                  {avg > 0 && (
                    <SkiaLine
                      p1={vec(chartBounds.left, lineY)}
                      p2={vec(chartBounds.right, lineY)}
                      strokeWidth={1.5}
                      color="#D4B856"
                    >
                      <DashPathEffect intervals={[4, 3]} />
                    </SkiaLine>
                  )}

                  {/* Bars */}
                  {points.mins.map((point, i) => {
                    const isToday = i === data.length - 1;
                    const isZero = data[i].mins === 0;
                    return (
                      <Bar
                        key={i}
                        points={[point]}
                        chartBounds={chartBounds}
                        color={isToday ? '#A0654A' : '#E8936A'}
                        opacity={isZero ? 0.25 : 1}
                        barWidth={BAR_W}
                        roundedCorners={{ topLeft: 4, topRight: 4 }}
                      />
                    );
                  })}
                </>
              );
            }}
          </CartesianChart>

          {/* X-axis date labels (every other bar, day number only) */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginTop: 2 }}>
            {data.map((d, i) => (
              <View key={i} style={{ width: BAR_W + BAR_GAP, alignItems: 'center' }}>
                <Text style={{ fontSize: 7.5, color: '#B8956A' }}>
                  {i % 2 === 0 ? d.day.slice(4) : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Avg label */}
      {avg > 0 && (
        <View style={{ alignItems: 'flex-end', marginTop: -28, marginRight: 4, marginBottom: 4 }}>
          <Text style={{ fontSize: 7.5, color: '#D4B856', fontWeight: '700' }}>avg {avg}m</Text>
        </View>
      )}

      {/* Legend */}
      <View className="mt-2 flex-row gap-3.5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-sm bg-terracotta" />
          <Text className="font-sans text-[9.5px] text-sand">Session</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-0.5 w-3.5 rounded bg-gold" />
          <Text className="font-sans text-[9.5px] text-sand">Daily avg ({avg} min)</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-sm bg-brown" />
          <Text className="font-sans text-[9.5px] text-sand">Today</Text>
        </View>
      </View>
    </View>
  );
}
