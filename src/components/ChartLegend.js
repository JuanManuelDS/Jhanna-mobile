import { View, Text } from 'react-native';
import { formatMins } from '../utils/chartData';

const MUTED = '#B8956A';

export default function ChartLegend({ mode, avg = 0 }) {
  if (mode === 'area') {
    return (
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
        <Item color="#E8936A" label="Cumulative" />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
      <Item color="#E8936A" label="Session" />
      <DashItem label={`Avg (${formatMins(avg)})`} />
      <Item color="#A0654A" label="Current" />
    </View>
  );
}

function Item({ color, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 9.5, color: MUTED }}>{label}</Text>
    </View>
  );
}

function DashItem({ label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: '#D4B856' }} />
      <Text style={{ fontSize: 9.5, color: MUTED }}>{label}</Text>
    </View>
  );
}
