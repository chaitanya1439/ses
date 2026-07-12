import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

export function HomeMap() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="map" size={48} color={theme.colors.primary} />
      <Text style={styles.text}>Map view available on mobile</Text>
      <Text style={styles.sub}>Scan the QR code in Expo Go to see live maps</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
