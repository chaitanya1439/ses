import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/colors';

type VehicleCategory = 'Bike' | 'Bike Boost' | 'Bike Metro';

// Dynamic rate configuration
interface RateConfig {
  distanceFare: {
    range1: { min: number; max: number; rate: number };
    range2: { min: number; max: number; rate: number };
  };
  timeFare: number;
  baseFare: number;
  platformFee: number;
  waitTimeCharge: { minWait: number; maxCharge: number; rate: number };
  longPickupFare: { minDistance: number; maxCharge: number; rate: number };
  cancellationFare: { min: number; max: number };
}

const DEFAULT_RATES: Record<VehicleCategory, RateConfig> = {
  'Bike': {
    distanceFare: {
      range1: { min: 0, max: 8, rate: 8.2 },
      range2: { min: 8, max: 100, rate: 11.3 },
    },
    timeFare: 0.262,
    baseFare: 11,
    platformFee: 2.5,
    waitTimeCharge: { minWait: 3, maxCharge: 20, rate: 1 },
    longPickupFare: { minDistance: 3, maxCharge: 10, rate: 4 },
    cancellationFare: { min: 0, max: 10 },
  },
  'Bike Boost': {
    distanceFare: {
      range1: { min: 0, max: 8, rate: 9.5 },
      range2: { min: 8, max: 100, rate: 12.5 },
    },
    timeFare: 0.3,
    baseFare: 15,
    platformFee: 3.5,
    waitTimeCharge: { minWait: 3, maxCharge: 25, rate: 1.5 },
    longPickupFare: { minDistance: 3, maxCharge: 15, rate: 5 },
    cancellationFare: { min: 0, max: 15 },
  },
  'Bike Metro': {
    distanceFare: {
      range1: { min: 0, max: 8, rate: 10.5 },
      range2: { min: 8, max: 100, rate: 14.0 },
    },
    timeFare: 0.35,
    baseFare: 20,
    platformFee: 4.5,
    waitTimeCharge: { minWait: 3, maxCharge: 30, rate: 2 },
    longPickupFare: { minDistance: 3, maxCharge: 20, rate: 6 },
    cancellationFare: { min: 0, max: 20 },
  }
};

export default function RateCardScreen() {
  const insets = useSafeAreaInsets();
  const { isNewDriver } = useLocalSearchParams();
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>('Bike');
  const [rates, setRates] = useState<Record<VehicleCategory, RateConfig> | null>(null);
  const [loading, setLoading] = useState(true);

  const categories: VehicleCategory[] = ['Bike', 'Bike Boost', 'Bike Metro'];

  // Simulate fetching dynamic rates
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setRates(DEFAULT_RATES);
        setLoading(false);
      }, 500);
    };
    fetchRates();
  }, []);

  const topPad = Platform.OS === 'web' ? insets.top + 10 : insets.top;

  const currentRate = rates ? rates[activeCategory] : null;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Rate Card</Text>
        <Pressable style={styles.helpBtn}>
          <MaterialCommunityIcons name="face-agent" size={18} color={theme.colors.text} />
          <Text style={styles.helpBtnText}>Help</Text>
        </Pressable>
      </View>

      <View style={styles.tabsWrapper}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.tab, activeCategory === cat && styles.activeTab]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading || !currentRate ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Fare</Text>
          </View>

          <View style={styles.fareCard}>
            {/* Distance Fare */}
            <View style={styles.fareItem}>
              <View style={styles.fareItemHeader}>
                <View>
                  <Text style={styles.fareItemTitle}>Distance Fare</Text>
                  <Text style={styles.fareItemSub}>For the kilometers travelled</Text>
                </View>
              </View>
              <View style={styles.dashedDivider} />
              
              <View style={styles.rangeRow}>
                <Text style={styles.rangeText}>{currentRate.distanceFare.range1.min} to {currentRate.distanceFare.range1.max} km</Text>
                <View style={styles.dash} />
                <Text style={styles.priceText}>₹{currentRate.distanceFare.range1.rate} <Text style={styles.perUnit}>per km</Text></Text>
              </View>
              <View style={styles.rangeRow}>
                <Text style={styles.rangeText}>{currentRate.distanceFare.range2.min} to {currentRate.distanceFare.range2.max} km</Text>
                <View style={styles.dash} />
                <Text style={styles.priceText}>₹{currentRate.distanceFare.range2.rate} <Text style={styles.perUnit}>per km</Text></Text>
              </View>
            </View>
            <View style={styles.solidDivider} />

            {/* Time Fare */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Time Fare</Text>
                <Text style={styles.fareItemSub}>Time to complete the order</Text>
              </View>
              <Text style={styles.priceText}>₹{currentRate.timeFare} <Text style={styles.perUnit}>per min</Text></Text>
            </View>
            <View style={styles.solidDivider} />

            {/* Base Fare */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Base Fare</Text>
                <Text style={styles.fareItemSub}>For completing an order</Text>
              </View>
              <Text style={styles.priceText}>₹{currentRate.baseFare}</Text>
            </View>
            <View style={styles.solidDivider} />

            {/* Platform fee */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Platform fee</Text>
                <Text style={styles.fareItemSub}>Collected from customer</Text>
              </View>
              <Text style={styles.priceText}>₹{currentRate.platformFee}</Text>
            </View>
            <View style={styles.solidDivider} />

            {/* Wait Time charges */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Wait Time charges</Text>
                <Text style={styles.fareItemSub}>After {currentRate.waitTimeCharge.minWait} min (Max ₹{currentRate.waitTimeCharge.maxCharge})</Text>
              </View>
              <Text style={styles.priceText}>+ ₹{currentRate.waitTimeCharge.rate} <Text style={styles.perUnit}>per min</Text></Text>
            </View>
          </View>


          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Extra Fare (not applicable on all orders)</Text>
          </View>

          <View style={styles.fareCard}>
             {/* Long Pickup Fare */}
             <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Long Pickup Fare per km</Text>
                <Text style={styles.fareItemSub}>After {currentRate.longPickupFare.minDistance} km (Max ₹{currentRate.longPickupFare.maxCharge})</Text>
              </View>
              <Text style={styles.priceText}>+ ₹{currentRate.longPickupFare.rate} <Text style={styles.perUnit}>per km</Text></Text>
            </View>
            <View style={styles.solidDivider} />

            {/* Cancellation Fare */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Cancellation Fare</Text>
                <Text style={styles.fareItemSub}>When the customer cancels</Text>
              </View>
              <Text style={styles.priceText}>+ ₹{currentRate.cancellationFare.min} to ₹{currentRate.cancellationFare.max}</Text>
            </View>
            <View style={styles.solidDivider} />

            {/* Surge Fare */}
            <View style={styles.fareItemRow}>
              <View style={styles.flex1}>
                <Text style={styles.fareItemTitle}>Surge Fare</Text>
                <Text style={styles.fareItemSub}>Extra fare paid by customer</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {isNewDriver && (
        <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable 
            style={styles.continueBtn} 
            onPress={() => router.replace({ pathname: '/subscription-plans', params: { isNewDriver: 'true' } })}
          >
            <Text style={styles.continueBtnText}>Proceed to Recharge Plans</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.dark} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  backBtn: { padding: 4, marginRight: 16 },
  headerTitle: {
    flex: 1, fontSize: 20, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: theme.colors.text,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    fontSize: 14, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 15, color: '#666',
    fontFamily: 'Poppins_500Medium',
  },
  activeTabText: {
    color: '#000', fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#E8F5E9', // Light green like in screenshot
    paddingHorizontal: 20, paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#1B5E20',
    fontFamily: 'Poppins_700Bold',
  },
  fareCard: {
    backgroundColor: '#FFF',
  },
  fareItem: {
    padding: 20,
  },
  fareItemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  fareItemTitle: {
    fontSize: 15, color: '#333', fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  fareItemSub: {
    fontSize: 13, color: '#777', marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 20,
  },
  rangeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 40,
  },
  rangeText: {
    fontSize: 14, color: '#555', width: 90,
    fontFamily: 'Poppins_400Regular',
  },
  dash: {
    width: 20, height: 1, backgroundColor: '#CCC', marginHorizontal: 12,
  },
  priceText: {
    fontSize: 16, color: '#000', fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  perUnit: {
    fontSize: 14, color: '#888', fontWeight: '400',
    fontFamily: 'Poppins_400Regular',
  },
  fareItemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20,
  },
  flex1: {
    flex: 1, paddingRight: 10,
  },
  bottomAction: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#EEE',
    ...theme.shadows.card,
  },
  continueBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 14, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  continueBtnText: {
    fontSize: 16, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
