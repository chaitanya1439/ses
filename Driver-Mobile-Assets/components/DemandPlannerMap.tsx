import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  heatmapPoints: any[];
}

export function DemandPlannerMap({ heatmapPoints }: Props) {
  return (
    <View style={styles.placeholderContainer}>
      <MaterialCommunityIcons name="fire" size={48} color={theme.colors.primary} />
      <Text style={styles.text}>Heatmap available on mobile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
});
