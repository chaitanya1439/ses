import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function DriverSelfie() {
  const insets = useSafeAreaInsets();
  const { updateDriver } = useAuth();
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleTakePic = async () => {
    if (!cameraRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (photo) {
        setPhotoUri(photo.uri);
      }
    } catch (e) {
      console.log('Failed to take pic', e);
    }
  };

  const handleConfirm = () => {
    if (!photoUri) return;
    
    updateDriver({
      isSelfieVerified: true,
      avatar: photoUri,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera to take a selfie.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Driver Selfie</Text>
        <View style={{ width: 40 }} />
      </View>

      {!photoUri ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            facing="front"
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.overlayText}>Position your face within the frame</Text>
            </View>
          </CameraView>
          
          <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Pressable style={styles.captureBtnInner} onPress={handleTakePic}>
              <View style={styles.captureBtnCore} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>

          <View style={styles.extractionCard}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.successText}>Looking Good!</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.retakeBtnText}>Retake</Text>
              </Pressable>
              
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  permissionText: {
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  permissionBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    fontWeight: '600',
    color: theme.colors.dark,
    fontFamily: 'Poppins_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 150,
  },
  overlayText: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bottomControls: {
    backgroundColor: '#000',
    paddingVertical: 20,
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  imagePreviewWrapper: {
    height: 350,
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  extractionCard: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.surface,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.success + '1A',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  retakeBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  confirmBtn: {
    flex: 2,
    height: 54,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
