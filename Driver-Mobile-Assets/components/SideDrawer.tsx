import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

const MENU_GROUPS = [
  {
    items: [
      { id: 'earnings', icon: 'wallet-outline', title: 'Earnings', sub: 'Transfer Money to Bank, History', route: '/earnings-overview' },
      { id: 'incentives', icon: 'cash', title: 'Incentives and More', sub: 'Know how you get paid', route: '/earnings-overview' },
      { id: 'rewards', icon: 'gift-outline', title: 'Rewards', sub: 'Insurance and Discounts', route: '/driver-rewards' },
    ],
  },
  {
    items: [
      { id: 'service', icon: 'view-grid-outline', title: 'Service Manager', sub: 'Food Delivery & more', route: '/service-manager' },
      { id: 'demand', icon: 'hexagon-outline', title: 'Demand Planner', sub: 'Past High Demand Areas & More', route: '/demand-planner' },
      { id: 'help', icon: 'headset', title: 'Help', sub: 'Get support, Accident Insurance', route: '/accidental-insurance' },
    ],
  },
];

export function SideDrawer({ isVisible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const [isOnRideStart, setIsOnRideStart] = useState(false);

  // Animation values
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, opacity, translateX]);

  // Pointer events control
  // Render nothing if fully hidden to avoid blocking touches
  if (!isVisible && (opacity as any)._value === 0) {
    return null;
  }

  const handleMenuPress = (route?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (route) {
      setTimeout(() => router.push(route as any), 150);
    }
  };

  return (
    <View style={styles.overlayContainer} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Dimmed Background */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View
        style={[
          styles.drawerPanel,
          {
            transform: [{ translateX }],
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* PROFILE SECTION */}
          <Pressable style={styles.profileSection} onPress={() => handleMenuPress('/profile')}>
            {driver?.avatar ? (
              <Image source={{ uri: driver.avatar }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#E5E7EB' }} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.profileTextCol}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{driver?.name || 'My Profile'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.profileRating}>-- ★</Text>
            </View>
          </Pressable>

          {/* MENU GROUPS */}
          <View style={styles.menuContainer}>
            {MENU_GROUPS.map((group, gIdx) => (
              <View key={gIdx}>
                {group.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item.route)}
                  >
                    <View style={styles.menuIconWrap}>
                      <MaterialCommunityIcons name={item.icon as any} size={24} color="#1A1A2E" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                  </Pressable>
                ))}
                {gIdx < MENU_GROUPS.length - 1 && <View style={styles.groupDivider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* BOTTOM FIXED SECTION */}
        <View style={styles.bottomSection}>
          {/* Referral Strip */}
          <Pressable
            style={styles.referralStrip}
            onPress={() => handleMenuPress('/refer-earn')}
          >
            <View style={styles.referralIcon}>
              <MaterialCommunityIcons name="tag" size={20} color="#22C55E" />
            </View>
            <View style={styles.referralTextCol}>
              <Text style={styles.referralSub}>Refer your friends &</Text>
              <Text style={styles.referralBold}>Earn up to ₹5000</Text>
            </View>
            <View style={styles.referBtn}>
              <Text style={styles.referBtnText}>Refer Now</Text>
            </View>
          </Pressable>

          {/* On-Ride Booking Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>On-Ride Booking</Text>
            <Switch
              value={isOnRideStart}
              onValueChange={(val) => {
                setIsOnRideStart(val);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: '#D1D5DB', true: '#22C55E' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // Over everything including the map
    elevation: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* Profile */
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileTextCol: {
    flex: 1,
    gap: 2,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginRight: 4,
  },
  profileRating: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'Poppins_600SemiBold',
  },

  /* Menu */
  menuContainer: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  menuSub: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  /* Bottom Section */
  bottomSection: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  referralStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  referralIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralTextCol: {
    flex: 1,
  },
  referralSub: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  referralBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  referBtn: {
    backgroundColor: '#1E3A8A', // Navy Blue
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  referBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  /* Toggle Row */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
