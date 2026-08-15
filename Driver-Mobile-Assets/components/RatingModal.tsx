import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/riderColors';

interface RatingModalProps {
  visible: boolean;
  driverName: string;
  onSubmit: (rating: number) => void;
  onSkip: () => void;
}

export default function RatingModal({ visible, driverName, onSubmit, onSkip }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitting(true);
    onSubmit(rating);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Rate your ride</Text>
          <Text style={styles.subtitle}>How was your trip with {driverName}?</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Ionicons 
                  name={star <= rating ? "star" : "star-outline"} 
                  size={40} 
                  color={star <= rating ? "#F59E0B" : "#D1D5DB"} 
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.skipBtn} onPress={onSkip} disabled={submitting}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable 
              style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center'
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32
  },
  starBtn: {
    padding: 4
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center'
  },
  skipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#4B5563'
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark,
    alignItems: 'center'
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB'
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff'
  }
});
