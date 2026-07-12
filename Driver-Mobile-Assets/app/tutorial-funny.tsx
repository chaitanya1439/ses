import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryLayout } from '@/components/StoryLayout';

export default function FunnyTutorialScreen() {
  const icon = (
    <View style={styles.topIcon}>
      <MaterialCommunityIcons name="face-man" size={24} color="#1A1A2E" />
    </View>
  );

  return (
    <StoryLayout
      currentIndex={1}
      icon={icon}
      title="Funny"
      overlayTitle="Watch funny videos"
      overlaySub="& share with fellow drivers"
    >
      <View style={styles.content}>
        {/* Fake Feed Card 1 */}
        <View style={styles.feedCard}>
          <View style={styles.comicPlaceholder}>
            <View style={styles.comicSky}>
              {/* Bike illustration mock */}
              <MaterialCommunityIcons name="motorbike" size={64} color="#FFF8E1" />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>Vroom!</Text>
                <View style={styles.speechTail} />
              </View>
            </View>
          </View>
          <View style={styles.reactionRow}>
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>😂</Text>
              <Text style={styles.emoji}>❤️</Text>
              <Text style={styles.emoji}>👍</Text>
            </View>
            <Text style={styles.shareText}>Share with friends</Text>
          </View>
        </View>

        {/* Fake Feed Card 2 (partial) */}
        <View style={[styles.feedCard, { opacity: 0.5, marginTop: 16 }]}>
          <View style={[styles.comicPlaceholder, { height: 100 }]} />
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Text style={styles.navTextInactive}>🏠 Home</Text>
          </View>
          <View style={styles.navItemActive}>
            <Text style={styles.navTextActive}>⬇ Orders</Text>
          </View>
        </View>
      </View>
    </StoryLayout>
  );
}

const styles = StyleSheet.create({
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
  },
  comicPlaceholder: {
    height: 220,
    backgroundColor: '#FFB800', // Bright warm yellow/orange accent
    justifyContent: 'center',
    alignItems: 'center',
  },
  comicSky: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    position: 'relative',
  },
  speechBubble: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  speechTail: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingVertical: 10,
  },
  navTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
