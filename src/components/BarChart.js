import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { calcChartVars, formatMins } from '../utils/chartData';

const VB_W = 300;
const CHART_H = 120;
const LABEL_BAND = 28;
const GAP = 6;

const TERRACOTTA = '#E8936A';
const BROWN = '#A0654A';
const GOLD = '#D4B856';
const MUTED = '#B8956A';

export default function BarChart({ data }) {
  const { avg, maxMins } = calcChartVars(data);
  const n = data.length;
  const barW = (VB_W - GAP * (n - 1)) / n;
  const avgY = CHART_H - (avg / maxMins) * CHART_H;

  return (
    <View
      testID="bar-chart"
      style={{ paddingBottom: 4, width: '100%', aspectRatio: VB_W / (CHART_H + LABEL_BAND) }}
    >
      <Svg
        viewBox={`0 0 ${VB_W} ${CHART_H + LABEL_BAND}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        {avg > 0 && (
          <Line
            x1={0}
            y1={avgY}
            x2={VB_W}
            y2={avgY}
            stroke={GOLD}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}
        {data.map((d, i) => {
          const isZero = d.mins === 0;
          const barH = isZero ? 3 : (d.mins / maxMins) * CHART_H;
          const x = i * (barW + GAP);
          const y = CHART_H - barH;
          const isLast = i === data.length - 1;
          return (
            <Rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={isLast ? BROWN : TERRACOTTA}
              opacity={isZero ? 0.25 : 1}
            />
          );
        })}
        {data.map((d, i) => {
          const x = i * (barW + GAP) + barW / 2;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={x}
              y={CHART_H + 14}
              textAnchor="middle"
              fontSize={7}
              fill={MUTED}
            >
              {d.label}
            </SvgText>
          );
        })}
        {avg > 0 && (
          <SvgText
            x={VB_W - 2}
            y={avgY - 3}
            textAnchor="end"
            fontSize={7}
            fill={GOLD}
            fontWeight="700"
          >
            avg {formatMins(avg)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
