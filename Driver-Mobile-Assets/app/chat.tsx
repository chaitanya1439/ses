import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  StatusBar,
  Platform,
  Image,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { theme } from "@/constants/colors";
import { useSocket } from "@/context/SocketContext";

interface Message {
  id: string;
  text: string;
  from: "driver" | "rider";
  timestamp: Date;
  pending?: boolean;
}

const QUICK_REPLIES = [
  "I'm on my way",
  "Traffic is heavy",
  "Arriving in 2 mins",
];

export default function DriverChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<any>();

  let rider: any = null;
  if (params.rider) {
    try {
      rider = JSON.parse(params.rider as string);
    } catch (e) {
      // ignore
    }
  }

  if (!rider) {
    rider = {
      id: params.id || "1",
      name: params.name || "Customer",
      photoUrl: params.photoUrl || "",
      phone: params.phone || "",
    };
  }

  const { isConnected, subscribe, sendMessage } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsub = subscribe("chat_message", (data) => {
      // Actually listen to 'chat_message' or 'CHAT_MESSAGE' mapped in realtime server
      if (data.from === rider.id || data.fromId === rider.id) {
        const textMsg = data.text || data.message;
        if (textMsg) {
          const newMsg: Message = {
            id: Date.now().toString() + Math.random().toString(),
            text: textMsg,
            from: "rider",
            timestamp: new Date(),
          };
          setMessages((prev) => [newMsg, ...prev]);
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
        }
      }
    });

    const unsubCap = subscribe("CHAT_MESSAGE", (data) => {
      if (data.from === rider.id || data.fromId === rider.id) {
        const textMsg = data.text || data.message;
        if (textMsg) {
          const newMsg: Message = {
            id: Date.now().toString() + Math.random().toString(),
            text: textMsg,
            from: "rider",
            timestamp: new Date(),
          };
          setMessages((prev) => [newMsg, ...prev]);
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
        }
      }
    });

    return () => {
      unsub();
      unsubCap();
    };
  }, [subscribe, rider.id]);

  useEffect(() => {
    if (isConnected && messageQueue.length > 0) {
      messageQueue.forEach((msg) => {
        sendMessage("CHAT_MESSAGE", { to: rider.id, message: msg.text });
      });
      setMessages((prev) =>
        prev.map((m) => (m.pending ? { ...m, pending: false } : m)),
      );
      setMessageQueue([]);
    }
  }, [isConnected, messageQueue, sendMessage, rider.id]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(),
      text: text.trim(),
      from: "driver",
      timestamp: new Date(),
      pending: !isConnected,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setShowQuickReplies(false);

    if (isConnected) {
      sendMessage("CHAT_MESSAGE", { to: rider.id, message: text.trim() });
    } else {
      setMessageQueue((prev) => [...prev, newMsg]);
    }

    setInputText("");
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.surface}
      />

      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          {!imgError && rider.photoUrl ? (
            <Image
              source={{ uri: rider.photoUrl }}
              style={styles.avatar}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.initials}>
              <Text style={styles.initialsText}>{getInitials(rider.name)}</Text>
            </View>
          )}
          <View style={styles.headerTitleBox}>
            <Text style={styles.name}>{rider.name}</Text>
            <Text style={styles.subtitle}>Passenger</Text>
          </View>
        </View>

        <Pressable
          style={styles.phoneBtn}
          onPress={() => Linking.openURL(`tel:${rider.phone || "0000000000"}`)}
        >
          <Ionicons name="call" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {!isConnected && (
        <View style={styles.disconnectBanner}>
          <Text style={styles.disconnectText}>
            Connection lost. Reconnecting...
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isMe = item.from === "driver";
          return (
            <View
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowThem,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleThem,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMe ? styles.textMe : styles.textThem,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
              <View
                style={[
                  styles.timeRow,
                  isMe ? styles.timeRowMe : styles.timeRowThem,
                ]}
              >
                <Text style={styles.timeText}>
                  {formatTime(item.timestamp)}
                </Text>
                {item.pending && (
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={theme.colors.textLight}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>
          );
        }}
        ListHeaderComponent={
          showQuickReplies ? (
            <View style={styles.quickRepliesContainer}>
              {QUICK_REPLIES.map((reply, idx) => (
                <Pressable
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSend(reply)}
                >
                  <Text style={styles.chipText}>{reply}</Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, 12) + 12 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Message"
          placeholderTextColor={theme.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: theme.colors.surfaceAlt,
  },
  initials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initialsText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: theme.colors.text,
  },
  headerTitleBox: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: theme.colors.textLight,
  },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  disconnectBanner: {
    backgroundColor: theme.colors.danger,
    paddingVertical: 8,
    alignItems: "center",
  },
  disconnectText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageRowMe: {
    alignSelf: "flex-end",
  },
  messageRowThem: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  textMe: {
    color: theme.colors.dark,
  },
  textThem: {
    color: theme.colors.text,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeRowMe: {
    justifyContent: "flex-end",
    paddingRight: 4,
  },
  timeRowThem: {
    justifyContent: "flex-start",
    paddingLeft: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
  },
  quickRepliesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.text,
    marginRight: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
});
