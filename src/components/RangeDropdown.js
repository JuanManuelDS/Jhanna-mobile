import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RANGE_OPTIONS } from '../utils/statsMockData';

export default function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = RANGE_OPTIONS.find((o) => o.value === value);

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Range selector"
        className="flex-row items-center gap-1 rounded-lg bg-sand px-2.5 py-1"
      >
        <Text className="font-sans-semibold text-[10px] text-brown">{selected.label}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#A0654A"
        />
      </Pressable>

      {open && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            backgroundColor: '#FDF3E6',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#C8A96E',
            minWidth: 130,
            shadowColor: '#643214',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { onChange(opt.value); setOpen(false); }}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 12,
                backgroundColor: opt.value === value ? '#EDD9C0' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: opt.value === value ? '700' : '400',
                  color: opt.value === value ? '#A0654A' : '#6B4226',
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
