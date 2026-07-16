import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

const DOC_TITLES: Record<string, string> = {
  dl: 'Driving License',
  rc: 'Registration Certificate (RC)',
  pan: 'PAN Card',
  aadhaar: 'Aadhaar Card',
};

export default function DriverDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const verifiedDocs = driver?.verifiedDocuments || {};
  const docEntries = Object.entries(verifiedDocs);

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
        <Text style={styles.topBarTitle}>My Documents</Text>
      </View>

      {/* ─── BODY ─── */}
      <ScrollView 
        style={styles.body}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {docEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No verified documents found.</Text>
            <Text style={styles.emptyStateSub}>Documents uploaded during onboarding will appear here.</Text>
          </View>
        ) : (
          docEntries.map(([type, doc]) => (
            <View key={type} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{DOC_TITLES[type] || type.toUpperCase()}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoCol}>
                  <Text style={styles.label}>Document Number</Text>
                  <Text style={styles.value}>{doc.number}</Text>
                  
                  {doc.expiry && (
                    <>
                      <Text style={[styles.label, { marginTop: 12 }]}>Expiry Date</Text>
                      <Text style={styles.value}>{doc.expiry}</Text>
                    </>
                  )}
                </View>

                {doc.imageUri && (
                  <Pressable 
                    style={styles.imageThumbnailWrap}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedImage(doc.imageUri);
                    }}
                  >
                    <Image source={{ uri: doc.imageUri }} style={styles.thumbnail} />
                    <View style={styles.expandIconWrap}>
                      <Ionicons name="expand" size={16} color="#FFF" />
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ─── IMAGE VIEWER MODAL ─── */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalCloseBtn} 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#FFF" />
          </Pressable>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSub: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    fontFamily: 'Poppins_600SemiBold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  imageThumbnailWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  expandIconWrap: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
});
