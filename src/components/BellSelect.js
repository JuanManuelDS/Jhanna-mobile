import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BELL_NAMES } from '../utils/bells';
import { playBellPreview, stopBellPreview } from '../hooks/useBells';

export default function BellSelect({ label, value, onChange, options = BELL_NAMES }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(value);

  useEffect(() => {
    if (open) setPending(value);
  }, [open, value]);

  useEffect(() => {
    return () => {
      stopBellPreview();
    };
  }, []);

  const handleRowPress = (name) => {
    setPending(name);
    playBellPreview(name);
  };

  const handleCancel = () => {
    stopBellPreview();
    setOpen(false);
  };

  const handleSave = () => {
    stopBellPreview();
    onChange(pending);
    setOpen(false);
  };

  return (
    <View className="flex-1 rounded-2xl border border-sand/20 bg-cream/60 px-3.5 py-2.5">
      <Text className="font-sans-medium text-[10px] uppercase tracking-[0.6px] text-sand">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        className="mt-1 flex-row items-center justify-between"
      >
        <Text className="font-sans-medium text-xs text-brown">{value}</Text>
        <Ionicons name="chevron-down" size={12} color="#C8A96E" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable
          onPress={handleCancel}
          testID="bell-select-backdrop"
          className="flex-1 items-center justify-center bg-black/40 px-8"
        >
          <Pressable className="w-full max-w-xs rounded-2xl border border-sand/30 bg-cream p-2">
            <Text className="px-3 pb-2 pt-1 font-sans-medium text-[11px] uppercase tracking-[0.6px] text-sand">
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === pending;
                return (
                  <Pressable
                    onPress={() => handleRowPress(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item}
                    className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                    style={selected ? { backgroundColor: 'rgba(232,147,106,0.12)' } : null}
                  >
                    <View
                      className="h-[18px] w-[18px] items-center justify-center rounded-full border"
                      style={{ borderColor: selected ? '#E8936A' : '#C8A96E' }}
                    >
                      {selected ? (
                        <View
                          className="h-[10px] w-[10px] rounded-full"
                          style={{ backgroundColor: '#E8936A' }}
                        />
                      ) : null}
                    </View>
                    <Text className="font-sans-medium text-sm text-brown">{item}</Text>
                  </Pressable>
                );
              }}
            />
            <View className="mt-1 flex-row items-center justify-end gap-2 px-2 pb-1 pt-2">
              <Pressable
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                className="rounded-xl px-4 py-2.5"
              >
                <Text className="font-sans-medium text-sm text-sand">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save"
                className="rounded-xl px-4 py-2.5"
                style={{ backgroundColor: '#E8936A' }}
              >
                <Text className="font-sans-medium text-sm text-offwhite">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
