import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';

interface Props {
  visible: boolean;
  onStayOnDuty: () => void;
  onGoOffDuty: () => void;
}

export function NightFareModal({ visible, onStayOnDuty, onGoOffDuty }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Title */}
          <Text style={styles.title}>Night fare starts at 11:00 PM</Text>

          {/* Green earning row */}
          <View style={styles.earningRow}>
            <View style={styles.rupeeCircle}>
              <Text style={styles.rupeeIcon}>₹</Text>
            </View>
            <Text style={styles.earningText}>Earn 25% Extra Fare</Text>
          </View>

          {/* Description with avatar */}
          <View style={styles.descRow}>
            <Image
              source={require('@/assets/images/driver_avatar.png')}
              style={styles.descAvatar}
              contentFit="cover"
            />
            <Text style={styles.descText}>
              Night fare starts everyday from 11:00 PM and ends at 6:00 AM
            </Text>
          </View>

          {/* CTA Buttons */}
          <Pressable
            style={styles.stayBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStayOnDuty();
            }}
          >
            <Text style={styles.stayBtnText}>Stay ON DUTY</Text>
          </Pressable>

          <Pressable
            style={styles.offBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onGoOffDuty();
            }}
          >
            <Text style={styles.offBtnText}>Go OFF DUTY</Text>
          </Pressable>
        </View>
      </View>
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
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  rupeeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: 'Poppins_700Bold',
  },
  earningText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: 'Poppins_700Bold',
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
  },
  descAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  descText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  stayBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  stayBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  offBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  offBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
});
