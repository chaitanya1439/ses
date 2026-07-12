import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
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

  useEffect(() => {
    if (!visible) return;
    
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
  }, [visible, subscribe, targetId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    sendMessage('CHAT_MESSAGE', { to: targetId, message: inputText.trim() });
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      text: inputText.trim(),
      fromMe: true,
      timestamp: new Date()
    }]);
    
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>{driverName || 'Driver'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
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
          {messages.length === 0 && (
            <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
          )}
        </ScrollView>

        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput 
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
          />
          <Pressable 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={!inputText.trim() ? '#94A3B8' : '#FFF'} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  chatArea: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(0,0,0,0.5)',
  },
  theirTimeText: {
    color: '#64748B',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 40,
    fontSize: 14,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
