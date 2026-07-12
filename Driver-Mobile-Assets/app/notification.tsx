import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Ellipse } from 'react-native-svg';

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const [activeTab, setActiveTab] = useState<'messages' | 'wallet'>('messages');

  const renderEmptyWallet = () => (
    <View style={styles.emptyState}>
      <View style={styles.envelopeContainer}>
        <Svg width="140" height="140" viewBox="0 0 140 140">
          {/* Main Envelope Body */}
          <Rect x="20" y="40" width="100" height="70" rx="6" fill="#E5E7EB" />
          
          {/* Envelope Flap (Open) */}
          <Path d="M20 40 L70 15 L120 40 L70 65 Z" fill="#D1D5DB" />
          
          {/* Envelope Inner Shadow Line */}
          <Path d="M20 110 L70 65 L120 110" fill="transparent" stroke="#F3F4F6" strokeWidth="4" />

          {/* Dashed Search/Scan Ring */}
          <Ellipse 
            cx="70" 
            cy="55" 
            rx="24" 
            ry="12" 
            fill="transparent" 
            stroke="#9CA3AF" 
            strokeWidth="2" 
            strokeDasharray="4 4" 
          />

          {/* Floating Person/Sender Badge */}
          <View style={styles.floatingSender}>
            <Ionicons name="person" size={14} color="#9CA3AF" />
          </View>
        </Svg>
        
        {/* '0' Badge overlapping bottom right */}
        <View style={styles.zeroBadge}>
          <Text style={styles.zeroText}>0</Text>
        </View>
      </View>
      
      <Text style={styles.emptyText}>Any new messages will be shown here</Text>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.topBarTitle}>Notification</Text>
      </View>

      {/* ─── TAB SELECTOR ─── */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'messages' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('messages');
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'messages' && styles.tabTextActive,
              ]}
            >
              Messages
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.tabBtn, activeTab === 'wallet' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('wallet');
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'wallet' && styles.tabTextActive,
              ]}
            >
              Wallet
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ─── CONTENT ─── */}
      <ScrollView
        style={styles.contentWrap}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'wallet' ? (
          renderEmptyWallet()
        ) : (
          <View>
            <Text style={styles.sectionLabel}>Today</Text>

            {/* NOTIFICATION CARD 1 - Refer and Earn */}
            <View style={styles.card}>
              <View style={[styles.cardBanner, { backgroundColor: '#FFB300' }]}>
                {/* Simulated illustration items */}
                <View style={styles.bannerRow}>
                  <View style={styles.appLogo}>
                    <Text style={styles.appLogoText}>A</Text>
                  </View>
                  <Text style={styles.bannerSub}>Exclusively Only for You</Text>
                </View>
                
                <Text style={styles.bannerTitle}>Refer and Earn</Text>
                
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>₹5000</Text>
                </View>

                {/* Floating Coins & Character Mock */}
                <MaterialCommunityIcons name="currency-inr" size={24} color="#FFF" style={styles.floatingCoin1} />
                <MaterialCommunityIcons name="currency-inr" size={18} color="#FFF" style={styles.floatingCoin2} />
                <MaterialCommunityIcons name="face-man" size={70} color="#FFF" style={styles.driverMockup} />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardHeading}>Refer & earn ₹5000 for every friend 🤑</Text>
                <Text style={styles.cardSub}>More friends, more funds 💰</Text>
                <Text style={[styles.cardText, { marginTop: 8 }]}>Hey Driver!!</Text>
                <Text style={styles.cardText}>Turn your contacts into cash.</Text>
                <Text style={styles.cardText}>Refer & earn ₹5000.</Text>
                <Text style={styles.timestamp}>4:31 pm</Text>
              </View>
            </View>

            {/* NOTIFICATION CARD 2 - Delivery promo (partial) */}
            <View style={styles.card}>
              <View style={[styles.cardBanner, { backgroundColor: '#556B2F', paddingBottom: 20 }]}>
                 {/* Dark olive green */}
                <Text style={styles.oliveBannerText}>😟 No Bike taxi orders</Text>
                <Text style={[styles.oliveBannerText, { fontSize: 22, marginTop: 4 }]}>Deliver Food</Text>
                <Text style={[styles.oliveBannerText, { fontSize: 13, marginTop: 8 }]}>Earn up to ₹16/km*</Text>

                <MaterialCommunityIcons name="motorbike" size={80} color="#FFF" style={styles.bikeMockup} />
              </View>
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' }, // Light gray page bg

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB', // Gray container
    borderRadius: 24,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  contentWrap: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },

  /* Empty State Wallet */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  envelopeContainer: {
    position: 'relative',
    marginBottom: 20,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingSender: {
    position: 'absolute',
    top: 25,
    right: 35,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zeroBadge: {
    position: 'absolute',
    bottom: 20,
    right: 25,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9CA3AF',
    borderWidth: 2,
    borderColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zeroText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },

  /* Messages Content */
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardBanner: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  appLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  bannerSub: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
    lineHeight: 28,
  },
  priceBadge: {
    backgroundColor: '#1E3A8A', // Blue
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  floatingCoin1: { position: 'absolute', right: 20, top: 10, opacity: 0.6 },
  floatingCoin2: { position: 'absolute', left: 40, bottom: -10, opacity: 0.5 },
  driverMockup: { position: 'absolute', right: 5, bottom: -15, opacity: 0.9 },
  
  cardBody: {
    padding: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
  },
  cardSub: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  cardText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    marginTop: 8,
  },

  /* Olive Banner Text */
  oliveBannerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    zIndex: 2,
  },
  bikeMockup: {
    position: 'absolute',
    right: 10,
    bottom: -10,
    opacity: 0.7,
    zIndex: 1,
  },
});
