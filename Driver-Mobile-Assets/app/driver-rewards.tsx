import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RewardCard {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  iconName: string;
}

const REWARDS: RewardCard[] = [
  {
    id: 'health',
    title: 'Health Insurance',
    subtitle: 'For you and your family',
    bgColor: '#E8F5E9',
    iconName: 'hospital-box-outline',
  },
  {
    id: 'accidental',
    title: 'Accidental Insurance',
    subtitle: 'Stay protected on ride',
    bgColor: '#FFF8E1',
    iconName: 'motorbike',
  },
  {
    id: 'medicine',
    title: 'Medicine Discount',
    subtitle: 'Upto 10% discount on medicines at Apollo medicals',
    bgColor: '#F3E5F5',
    iconName: 'pill',
  },
];

export default function DriverRewardsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={styles.topBarTitle}>Driver Rewards</Text>
        </View>
        <Pressable style={styles.helpPill}>
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {REWARDS.map((reward) => (
          <View
            key={reward.id}
            style={[styles.card, { backgroundColor: reward.bgColor }]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{reward.title}</Text>
              <Text style={styles.cardSubtitle}>{reward.subtitle}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.knowMoreBtn,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (reward.id === 'accidental') {
                    router.push('/accidental-insurance' as any);
                  } else if (reward.id === 'health') {
                    router.push('/insurances' as any);
                  }
                }}
              >
                <Text style={styles.knowMoreText}>Know More</Text>
              </Pressable>
            </View>
            <View style={styles.cardImagePlaceholder}>
              <MaterialCommunityIcons
                name={reward.iconName as any}
                size={48}
                color={
                  reward.id === 'health'
                    ? '#4CAF50'
                    : reward.id === 'accidental'
                    ? '#FF8C00'
                    : '#9C27B0'
                }
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  helpPill: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  helpPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins_600SemiBold',
  },

  scrollContent: { padding: 16, gap: 16 },

  card: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 20,
    minHeight: 160,
    overflow: 'hidden',
  },
  cardContent: { flex: 1, justifyContent: 'center', gap: 6 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  knowMoreBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A1A2E',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  knowMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },
  cardImagePlaceholder: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
