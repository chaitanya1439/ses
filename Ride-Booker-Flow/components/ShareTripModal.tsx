import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from "expo-haptics";
import * as Contacts from 'expo-contacts';

const initialContacts = [
  { id: '1', name: 'Jane Williams', initials: 'JW', color: '#2563EB', selected: true },
  { id: '2', name: 'Rachel Davis', initials: 'RD', color: '#60A5FA', selected: false },
  { id: '3', name: 'Brad Walker', initials: 'BW', color: '#93C5FD', selected: false },
  { id: '4', name: 'Blake Liv', initials: 'BL', color: '#BFDBFE', selected: false },
];

const generateColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function ShareTripModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<any[]>(initialContacts);

  useEffect(() => {
    (async () => {
      if (visible) {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name],
          });
          if (data.length > 0) {
            // Take first 10 contacts with names
            const mapped = data.filter(c => c.name).slice(0, 10).map((c, i) => {
              const names = c.name.split(' ');
              const initials = (names[0]?.[0] || '') + (names[1]?.[0] || '');
              return {
                id: c.id || String(i),
                name: c.name,
                initials: initials.toUpperCase() || '?',
                color: generateColor(c.name),
                selected: false,
              };
            });
            if (mapped.length > 0) {
              setContacts(mapped);
            }
          }
        }
      }
    })();
  }, [visible]);

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Share trip status</Text>
          <Text style={styles.subtitle}>Tap a contact to share your trip status</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsScroll}>
          <Pressable style={styles.contactItem} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <View style={[styles.avatar, styles.addAvatar]}>
              <Ionicons name="add" size={28} color="#2563EB" />
            </View>
            <Text style={[styles.contactName, { color: '#2563EB' }]}>Add{"\n"}Contact</Text>
          </Pressable>

          {contacts.map((c) => (
            <Pressable key={c.id} style={styles.contactItem} onPress={() => toggleSelect(c.id)}>
              <View style={[styles.avatar, { backgroundColor: c.selected ? '#2563EB' : c.color }]}>
                {c.selected ? (
                  <Ionicons name="checkmark" size={24} color={Colors.white} />
                ) : (
                  <Text style={styles.initials}>{c.initials}</Text>
                )}
              </View>
              <Text style={styles.contactName} numberOfLines={2}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.saveBtn} onPress={onClose}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  contactsScroll: {
    paddingBottom: 20,
    gap: 16,
  },
  contactItem: {
    alignItems: 'center',
    width: 72,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addAvatar: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initials: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
  },
  contactName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.dark,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.dark,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
