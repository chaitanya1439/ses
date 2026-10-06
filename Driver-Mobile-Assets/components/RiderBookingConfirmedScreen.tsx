import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RiderBookingConfirmedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rider Tracking is only available on the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#333',
  }
});
