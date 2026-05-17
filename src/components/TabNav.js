import { View, Text, Pressable } from 'react-native';

const TABS = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
  { label: 'All Time', value: 'all' },
];

const BROWN = '#A0654A';
const INACTIVE = 'rgba(160, 101, 74, 0.4)';
const TERRACOTTA = '#E8936A';
const STRIP_BORDER = 'rgba(200, 169, 110, 0.18)';

export default function TabNav({ value, onChange }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: STRIP_BORDER,
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
              paddingTop: 11,
              paddingBottom: 9,
              paddingHorizontal: 4,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: active ? TERRACOTTA : 'transparent',
              marginBottom: -1,
              backgroundColor: 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: active ? 'DMSans_500Medium' : 'DMSans_400Regular',
                fontSize: 12,
                letterSpacing: 0.4,
                color: active ? BROWN : INACTIVE,
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
