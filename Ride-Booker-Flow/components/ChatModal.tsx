import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '@/contexts/SocketContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp: Date;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: string;
  driverName?: string;
}

export default function ChatModal({ visible, onClose, targetId, driverName }: ChatModalProps) {
  const insets = useSafeAreaInsets();
  const { subscribe, sendMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Quick reply suggestions
  const quickReplies = ['On my way!', 'Wait 2 min', 'I\'m here', 'Where are you?'];

  useEffect(() => {
    const unsubscribe = subscribe('CHAT_MESSAGE', (payload) => {
      if (payload.from === targetId || payload.fromId === targetId) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          text: payload.message || payload.text,
          fromMe: false,
          timestamp: new Date(payload.timestamp || Date.now())
        }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    return () => unsubscribe();
  }, [subscribe, targetId]);

  const handleSend = (text?: string) => {
    const msgText = (text || inputText).trim();
    if (!msgText) return;
    
    sendMessage('CHAT_MESSAGE', { to: targetId, message: msgText });
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      text: msgText,
      fromMe: true,
      timestamp: new Date()
    }]);
    
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayName = driverName && driverName.length > 20 
    ? driverName.substring(0, 8) + '...' 
    : (driverName || 'Driver');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Premium Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark} />
          </Pressable>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={18} color="#9CA3AF" />
            </View>
            <View>
              <Text style={styles.headerName}>{displayName}</Text>
              <Text style={styles.headerStatus}>Your driver</Text>
            </View>
          </View>

          <Pressable style={styles.headerCallBtn}>
            <Ionicons name="call-outline" size={20} color={Colors.dark} />
          </Pressable>
        </View>

        {/* ── Chat Messages ── */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="chatbubbles-outline" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Send a message to your driver. Be polite and clear!
              </Text>
            </View>
          )}

          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.fromMe ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, msg.fromMe ? styles.myMessageText : styles.theirMessageText]}>
                {msg.text}
              </Text>
              <Text style={[styles.timeText, msg.fromMe ? styles.myTimeText : styles.theirTimeText]}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Quick Replies (show only when no messages) ── */}
        {messages.length === 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.quickReplyRow}
          >
            {quickReplies.map((reply) => (
              <Pressable 
                key={reply} 
                style={styles.quickReplyChip} 
                onPress={() => handleSend(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Input Area ── */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
              onSubmitEditing={() => handleSend()}
            />
          </View>
          <Pressable 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color={!inputText.trim() ? '#CBD5E1' : '#FFF'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '33',
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    marginTop: -1,
  },
  headerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Chat Area ──
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 19,
  },
  // ── Message Bubbles ──
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.dark,
    borderBottomRightRadius: 6,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  theirMessageText: {
    color: Colors.dark,
    fontFamily: 'Poppins_400Regular',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: 'Poppins_400Regular',
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.5)',
  },
  theirTimeText: {
    color: '#94A3B8',
  },
  // ── Quick Replies ──
  quickReplyRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: Colors.dark,
  },
  // ── Input ──
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: Colors.dark,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
});
