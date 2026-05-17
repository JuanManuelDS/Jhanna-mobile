import { View } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

const AREA_W = 300;
const AREA_H = 130;
const LABEL_BAND = 20;

const TERRACOTTA = '#E8936A';
const SAND = '#C8A96E';

export default function AreaChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.cumulative), 1);
  const stepX = data.length > 1 ? AREA_W / (data.length - 1) : AREA_W;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: AREA_H - (d.cumulative / maxVal) * (AREA_H - 10),
  }));

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = points[i - 1];
      const dx = p.x - prev.x;
      const cp1x = prev.x + 0.4 * dx;
      const cp1y = prev.y;
      const cp2x = prev.x + 0.6 * dx;
      const cp2y = p.y;
      return `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
    })
    .join(' ');

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L${lastPoint.x},${AREA_H} L${firstPoint.x},${AREA_H} Z`;

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
            <Stop offset="0%" stopColor={TERRACOTTA} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={TERRACOTTA} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path
          d={linePath}
          fill="none"
          stroke={TERRACOTTA}
          strokeWidth={1.8}
          opacity={0.7}
        />
        <Circle
          testID="area-end-dot"
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={TERRACOTTA}
        />
        {data.map((d, i) =>
          d.label ? (
            <SvgText
              key={`yr-${i}`}
              x={i * stepX}
              y={AREA_H + 14}
              textAnchor="middle"
              fontFamily="DMSans_400Regular"
              fontSize={7.5}
              fill={SAND}
            >
              {d.label}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}
