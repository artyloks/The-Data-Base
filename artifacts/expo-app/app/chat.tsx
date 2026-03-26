import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  sendMessage,
  getChatHistory,
  type ChatMessage,
  type ToolCall,
} from "@/lib/api";

const SESSION_ID = "expo-mobile-session";

function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const statusColors = {
    pending: "#f59e0b",
    success: "#34d399",
    error: "#f87171",
  };

  return (
    <View style={styles.toolBadge}>
      <View
        style={[
          styles.toolStatusDot,
          { backgroundColor: statusColors[toolCall.status] },
        ]}
      />
      <Text style={styles.toolName}>
        {toolCall.server}/{toolCall.name}
      </Text>
      {toolCall.duration && (
        <Text style={styles.toolDuration}>{toolCall.duration}ms</Text>
      )}
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      {!isUser && message.thinking && (
        <View style={styles.thinkingContainer}>
          <Ionicons name="bulb-outline" size={14} color="#6b7280" />
          <Text style={styles.thinkingText} numberOfLines={2}>
            {message.thinking}
          </Text>
        </View>
      )}

      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <View style={styles.toolCallsContainer}>
          {message.toolCalls.map((tc) => (
            <ToolCallBadge key={tc.id} toolCall={tc} />
          ))}
        </View>
      )}

      <Text style={[styles.messageText, isUser && styles.userText]}>
        {message.content}
      </Text>

      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getChatHistory(SESSION_ID)
      .then(setMessages)
      .catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInput("");
    setIsLoading(true);
    setActiveToolCalls([]);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      await sendMessage(
        text,
        SESSION_ID,
        (toolCall) => {
          setActiveToolCalls((prev) => {
            const existing = prev.find((tc) => tc.id === toolCall.id);
            if (existing) {
              return prev.map((tc) => (tc.id === toolCall.id ? toolCall : tc));
            }
            return [...prev, toolCall];
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        (response) => {
          setMessages((prev) => [
            ...prev,
            {
              id: response.id,
              role: "assistant",
              content: response.content,
              toolCalls: response.toolCalls,
              thinking: response.thinking,
              timestamp: response.timestamp,
            },
          ]);
          setActiveToolCalls([]);
          setIsLoading(false);
          scrollToBottom();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      );
    } catch (error) {
      setIsLoading(false);
      setActiveToolCalls([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [input, isLoading, scrollToBottom]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>Start a conversation</Text>
            <Text style={styles.emptySubtext}>
              The agent will autonomously use tools to help you
            </Text>
          </View>
        }
      />

      {activeToolCalls.length > 0 && (
        <View style={styles.activeToolsBar}>
          <ActivityIndicator size="small" color="#60a5fa" />
          <View style={styles.activeToolsList}>
            {activeToolCalls.map((tc) => (
              <ToolCallBadge key={tc.id} toolCall={tc} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask The Brain..."
          placeholderTextColor="#666"
          multiline
          maxLength={2000}
          editable={!isLoading}
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1f1f1f",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#e5e5e5",
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  thinkingText: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  toolCallsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  toolBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  toolStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toolName: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: "monospace",
  },
  toolDuration: {
    fontSize: 10,
    color: "#6b7280",
  },
  activeToolsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  activeToolsList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  input: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 250,
  },
});
