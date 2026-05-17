import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { calcChartVars, formatMins } from '../utils/chartData';

const VB_W = 300;
const CHART_H = 120;
const LABEL_BAND = 22;
const GAP = 6;

const TERRACOTTA = '#E8936A';
const BROWN = '#A0654A';
const GOLD = '#D4B856';
const SAND = '#C8A96E';

export default function BarChart({ data }) {
  const { avg, maxMins } = calcChartVars(data);
  const n = data.length;
  const barW = (VB_W - GAP * (n - 1)) / n;
  const avgY = CHART_H - (avg / maxMins) * CHART_H;

  return (
    <View
      testID="bar-chart"
      style={{ width: '100%', aspectRatio: VB_W / (CHART_H + LABEL_BAND) }}
    >
      <Svg
        viewBox={`0 0 ${VB_W} ${CHART_H + LABEL_BAND}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        {avg > 0 && (
          <Line
            testID="avg-line"
            x1={0}
            y1={avgY}
            x2={VB_W}
            y2={avgY}
            stroke={GOLD}
            strokeWidth={0.8}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}
        {data.map((d, i) => {
          const isZero = d.mins === 0;
          const barH = isZero ? 2 : (d.mins / maxMins) * CHART_H;
          const x = i * (barW + GAP);
          const y = CHART_H - barH;
          const isLast = i === data.length - 1;
          const rx = barW / 2.5;
          return (
            <Rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={rx}
              fill={isLast ? BROWN : TERRACOTTA}
              opacity={isZero ? 0.15 : isLast ? 1 : 0.7}
            />
          );
        })}
        {data.map((d, i) => {
          const x = i * (barW + GAP) + barW / 2;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={x}
              y={CHART_H + 12}
              textAnchor="middle"
              fontFamily="DMSans_400Regular"
              fontSize={7}
              fill={SAND}
            >
              {d.label}
            </SvgText>
          );
        })}
        {avg > 0 && (
          <SvgText
            x={VB_W - 2}
            y={avgY - 4}
            textAnchor="end"
            fontFamily="DMSans_500Medium"
            fontSize={7}
            fill={GOLD}
            opacity={0.8}
          >
            avg {formatMins(avg)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
