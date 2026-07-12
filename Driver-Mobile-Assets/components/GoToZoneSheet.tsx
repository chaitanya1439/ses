import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NearbyItem {
  id: string;
  label: string;
  icon: string;
  iconFamily: 'MaterialCommunityIcons' | 'Ionicons' | 'FontAwesome5';
  bgColor: string;
  iconColor: string;
}

const NEARBY_ITEMS: NearbyItem[] = [
  { id: 'mall', label: 'Mall', icon: 'shopping', iconFamily: 'MaterialCommunityIcons', bgColor: '#E3F2FD', iconColor: '#1976D2' },
  { id: 'petrol', label: 'Petrol Bunk', icon: 'gas-station', iconFamily: 'MaterialCommunityIcons', bgColor: '#FFF9C4', iconColor: '#F9A825' },
  { id: 'atm', label: 'ATM', icon: 'currency-inr', iconFamily: 'MaterialCommunityIcons', bgColor: '#E8F5E9', iconColor: '#388E3C' },
  { id: 'bus', label: 'Bus stops', icon: 'bus', iconFamily: 'MaterialCommunityIcons', bgColor: '#FCE4EC', iconColor: '#C62828' },
  { id: 'restaurant', label: 'Restaurant', icon: 'silverware-fork-knife', iconFamily: 'MaterialCommunityIcons', bgColor: '#F3E5F5', iconColor: '#7B1FA2' },
  { id: 'hospital', label: 'Hospital', icon: 'hospital-box', iconFamily: 'MaterialCommunityIcons', bgColor: '#FFEBEE', iconColor: '#D32F2F' },
];

function renderIcon(item: NearbyItem) {
  return <MaterialCommunityIcons name={item.icon as any} size={26} color={item.iconColor} />;
}

export function GoToZoneSheet({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Explore Nearby Areas</Text>

          <View style={styles.grid}>
            {NEARBY_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                style={styles.gridItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                  {renderIcon(item)}
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 20,
  },
  gridItem: {
    alignItems: 'center',
    width: '28%',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
