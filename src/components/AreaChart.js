import { View } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const AREA_W = 300;
const AREA_H = 130;
const LABEL_BAND = 24;

const TERRACOTTA = '#E8936A';
const MUTED = '#B8956A';

export default function AreaChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.cumulative), 1);
  const stepX = data.length > 1 ? AREA_W / (data.length - 1) : AREA_W;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: AREA_H - (d.cumulative / maxVal) * (AREA_H - 10),
  }));

  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(' ');
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${AREA_H} L${points[0].x},${AREA_H} Z`;

  return (
    <View
      testID="area-chart"
      style={{ width: '100%', aspectRatio: AREA_W / (AREA_H + LABEL_BAND) }}
    >
      <Svg
        viewBox={`0 0 ${AREA_W} ${AREA_H + LABEL_BAND}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={TERRACOTTA} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={TERRACOTTA} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path d={linePath} fill="none" stroke={TERRACOTTA} strokeWidth={2} />
        {data.map((d, i) =>
          d.label ? (
            <SvgText
              key={`yr-${i}`}
              x={i * stepX}
              y={AREA_H + 16}
              textAnchor="middle"
              fontSize={7.5}
              fill={MUTED}
            >
              {d.label}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}
