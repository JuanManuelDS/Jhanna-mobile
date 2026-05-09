import { View, Text, Pressable } from 'react-native';

const TABS = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
  { label: 'All Time', value: 'all' },
];

const BROWN = '#A0654A';
const TAN = '#C8A96E';
const MUTED = '#B8956A';

export default function StatsTabs({ value, onChange }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: TAN,
      }}
    >
      {TABS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingTop: 10,
              paddingBottom: 8,
              alignItems: 'center',
              borderBottomWidth: 2.5,
              borderBottomColor: active ? BROWN : 'transparent',
              marginBottom: -1.5,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: active ? '700' : '400',
                color: active ? BROWN : MUTED,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { TABS };
