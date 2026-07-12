import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

interface Props {
  onGoToPress?: () => void;
  onPlansPress?: () => void;
  onFilterPress?: () => void;
  onFunnyPress?: () => void;
}

export function QuickActionIcons({ onGoToPress, onPlansPress, onFilterPress, onFunnyPress }: Props) {
  const actions: ActionItem[] = [
    {
      id: 'funny',
      label: 'Funny',
      icon: (
        <Image
          source={require('@/assets/images/driver_avatar.png')}
          style={styles.actionImage}
          contentFit="cover"
        />
      ),
      onPress: onFunnyPress,
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: <Ionicons name="settings" size={28} color={theme.colors.textMuted} />,
      onPress: onFilterPress,
    },
    {
      id: 'goto',
      label: 'Go To',
      icon: (
        <View style={{ position: 'relative', width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="map-marker-path" size={28} color="#E53935" style={{ position: 'absolute' }} />
          <MaterialCommunityIcons name="heart" size={12} color="#FFFFFF" style={{ position: 'absolute', top: 5 }} />
        </View>
      ),
      onPress: onGoToPress,
    },
    {
      id: 'plans',
      label: 'Plans',
      icon: <Text style={styles.rupeeIcon}>₹</Text>,
      onPress: onPlansPress,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Up-chevron indicator */}
      <View style={styles.chevronRow}>
        <Ionicons name="chevron-up" size={22} color={theme.colors.textMuted} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={styles.actionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              action.onPress?.();
            }}
          >
            <View style={[
              styles.iconCircle,
              action.id === 'plans' && styles.plansCircle,
              action.id === 'goto' && styles.gotoCircle,
            ]}>
              {action.icon}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...theme.shadows.sm,
  },
  chevronRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
    paddingBottom: 8,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  gotoCircle: {
    backgroundColor: theme.colors.pinkLight,
    borderColor: theme.colors.pink + '40',
  },
  plansCircle: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.planYellow + '60',
  },
  actionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  rupeeIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.planYellow,
    fontFamily: 'Poppins_700Bold',
  },
  actionLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
