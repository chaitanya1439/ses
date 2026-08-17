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
import { Colors } from "@/constants/colors";
import { useSocket } from "@/contexts/SocketContext";

interface Message {
  id: string;
  text: string;
  from: "user" | "driver";
  timestamp: Date;
  pending?: boolean;
}

const QUICK_REPLIES = ["I'm here", "Be right there", "I'm looking for you"];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<any>();

  let driver: any = null;
  if (params.driver) {
    try {
      driver = JSON.parse(params.driver as string);
    } catch (e) {
      // ignore
    }
  }

  if (!driver) {
    driver = {
      id: params.id || "1",
      name: params.name || "Driver",
      photoUrl: params.photoUrl || "",
      vehicle: params.vehicle || "Vehicle",
      plate: params.plate || "PLATE",
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

  // 6. WEBSOCKET - Listen for messages
  useEffect(() => {
    const unsub = subscribe("chat_message", (data) => {
      // Check if message is from the matched driver
      if (data.from === driver.id && data.message) {
        const newMsg: Message = {
          id: Date.now().toString() + Math.random().toString(),
          text: data.message,
          from: "driver",
          timestamp: new Date(),
        };
        setMessages((prev) => [newMsg, ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });
    return unsub;
  }, [subscribe, driver.id]);

  // 9. ERROR HANDLING - Re-send queued messages on reconnect
  useEffect(() => {
    if (isConnected && messageQueue.length > 0) {
      messageQueue.forEach((msg) => {
        sendMessage("chat_message", { to: driver.id, message: msg.text });
      });
      setMessages((prev) =>
        prev.map((m) => (m.pending ? { ...m, pending: false } : m)),
      );
      setMessageQueue([]);
    }
  }, [isConnected, messageQueue, sendMessage, driver.id]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(),
      text: text.trim(),
      from: "user",
      timestamp: new Date(),
      pending: !isConnected,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setShowQuickReplies(false);

    if (isConnected) {
      sendMessage("chat_message", { to: driver.id, message: text.trim() });
    } else {
      setMessageQueue((prev) => [...prev, newMsg]);
    }

    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Smoothly scroll down (using index 0 since it's an inverted list)
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* 2. HEADER - dynamic */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </Pressable>

        <View style={styles.headerCenter}>
          {!imgError && driver.photoUrl ? (
            <Image
              source={{ uri: driver.photoUrl }}
              style={styles.driverAvatar}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.driverInitials}>
              <Text style={styles.initialsText}>
                {getInitials(driver.name)}
              </Text>
            </View>
          )}
          <View style={styles.headerTitleBox}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverVehicle}>
              {driver.vehicle} · {driver.plate}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.phoneBtn}
          onPress={() => Linking.openURL(`tel:${driver.phone || "0000000000"}`)}
        >
          <Ionicons name="call" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      {/* 9. DISCONNECT BANNER */}
      {!isConnected && (
        <View style={styles.disconnectBanner}>
          <Text style={styles.disconnectText}>
            Connection lost. Reconnecting...
          </Text>
        </View>
      )}

      {/* 4. MESSAGES LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isUser = item.from === "user";
          return (
            <View
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowDriver,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleDriver,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.textUser : styles.textDriver,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
              <View
                style={[
                  styles.timeRow,
                  isUser ? styles.timeRowUser : styles.timeRowDriver,
                ]}
              >
                <Text style={styles.timeText}>
                  {formatTime(item.timestamp)}
                </Text>
                {item.pending && (
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={Colors.grey}
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

      {/* 5. TEXT INPUT */}
      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, 12) + 12 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Message"
          placeholderTextColor={Colors.grey}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
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
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: Colors.lightGrey,
  },
  driverInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initialsText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  headerTitleBox: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  driverVehicle: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  disconnectBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: 8,
    alignItems: "center",
  },
  disconnectText: {
    color: Colors.white,
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
  messageRowUser: {
    alignSelf: "flex-end",
  },
  messageRowDriver: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: Colors.dark,
    borderBottomRightRadius: 4,
  },
  bubbleDriver: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  textUser: {
    color: Colors.white,
  },
  textDriver: {
    color: Colors.dark,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeRowUser: {
    justifyContent: "flex-end",
    paddingRight: 4,
  },
  timeRowDriver: {
    justifyContent: "flex-start",
    paddingLeft: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  quickRepliesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  chip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    marginRight: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2, // Align with bottom of input
  },
  sendBtnDisabled: {
    backgroundColor: Colors.mediumGrey,
  },
});
