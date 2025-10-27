// src/widget/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import {
  MessageStatus,
  type WidgetMessageDto as Message,
} from "@live-chat/shared";
// Socket.IO runs on the root domain, not /api/v1
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

// Utility function for timestamped logging
const logWithTime = (instanceId: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.log(
    `[${timestamp}] [SocketService ${instanceId}] ${message}`,
    ...args
  );
};

const errorWithTime = (instanceId: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.error(
    `[${timestamp}] [SocketService ${instanceId}] ${message}`,
    ...args
  );
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false; // Prevent race conditions
  private eventHandlers: Map<string, Function> = new Map(); // Track handlers for cleanup
  private lastContextUpdate = 0;
  private readonly instanceId: string;
  private connectionCount = 0;
  private disconnectionCount = 0;

  constructor() {
    this.instanceId = crypto.randomUUID().slice(0, 8);
    logWithTime(
      this.instanceId,
      `✨ Instance created at ${new Date().toISOString()}`
    );
  }

  // Method to connect and listen for events
  public connect(projectId: string, visitorUid: string): void {
    this.connectionCount++;
    const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

    // Prevent multiple simultaneous connection attempts
    if (this.socket?.connected || this.isConnecting) {
      errorWithTime(
        this.instanceId,
        `⚠️ Connect IGNORED: socket already ${
          this.socket?.connected ? "CONNECTED" : "CONNECTING"
        } | Current socket ID: ${this.socket?.id}`
      );
      return;
    }

    // Clean up old socket completely before creating new one
    if (this.socket) {
      errorWithTime(
        this.instanceId,
        `⚠️ STALE SOCKET FOUND! Disconnecting it before creating new one. Old socket ID: ${this.socket.id}`
      );
      this.disconnect();
    }

    this.isConnecting = true;

    const {
      setConnectionStatus,
      loadConversationHistory,
      addMessage,
      setAgentIsTyping,
      incrementUnreadCount,
      finalizeMessage,
      setSessionReady,
    } = useChatStore.getState();
    setConnectionStatus("connecting");

    this.socket = io(socketUrlWithParams, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000, // Cap max delay at 10s
      timeout: 10000, // Connection timeout
    });

    this.socket.onAny((event, ...args) => {
      logWithTime(this.instanceId, `📥 Event received: ${event}`, args);
    });

    const connectHandler = () => {
      this.isConnecting = false;
      setConnectionStatus("connected");
      logWithTime(
        this.instanceId,
        `✅ Socket CONNECTED with ID: ${this.socket?.id} | Total connections: ${this.connectionCount}`
      );
    };

    const disconnectHandler = () => {
      this.isConnecting = false;
      this.disconnectionCount++;
      setConnectionStatus("disconnected");
      setSessionReady(false); // Reset session readiness
      logWithTime(
        this.instanceId,
        `🔌 Socket DISCONNECTED | Socket ID was: ${this.socket?.id} | Total disconnections: ${this.disconnectionCount}`
      );
    };

    const connectErrorHandler = (error: Error) => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
      setSessionReady(false); // Reset session readiness
      errorWithTime(this.instanceId, `❌ Connection ERROR:`, error);
    };

    const reconnectFailedHandler = () => {
      this.isConnecting = false;
      setConnectionStatus("disconnected");
      setSessionReady(false); // Reset session readiness
      errorWithTime(
        this.instanceId,
        `❌ Socket reconnection FAILED after all attempts`
      );
    };

    const conversationHistoryHandler = (data: { messages: Message[] }) => {
      logWithTime(this.instanceId, `📜 Conversation history received:`, data);
      loadConversationHistory(data.messages);
      setSessionReady(true); // Session is now ready
    };

    const messageSentHandler = (data: {
      tempId: string;
      finalMessage: any;
    }) => {
      logWithTime(this.instanceId, `📤 Message sent:`, data);
      const finalMessage = data.finalMessage;
      const correctedMessage: Message = {
        ...finalMessage,
        sender: {
          type: finalMessage.sender === "visitor" ? "visitor" : "agent",
        },
      };
      finalizeMessage(data.tempId, correctedMessage);
    };

    const agentRepliedHandler = (data: any) => {
      // Transform the data to match the Message type
      logWithTime(this.instanceId, `📥 Agent replied:`, data);
      const newMessage: Message = {
        id: data.id,
        content: data.content,
        sender: {
          type: data.fromCustomer ? "visitor" : "agent",
        },
        status: MessageStatus.SENT, // Assuming the message is sent successfully
        timestamp: data.createdAt,
      };

      addMessage(newMessage);
      logWithTime(
        this.instanceId,
        `💬 New message added from agent | Message ID: ${newMessage.id}`
      );
      if (!useChatStore.getState().isWindowOpen) {
        logWithTime(
          this.instanceId,
          `🔔 Chat window is closed, incrementing unread count`
        );
        incrementUnreadCount();
      }
    };

    const agentIsTypingHandler = (data: {
      agentName: string;
      isTyping: boolean;
    }) => {
      logWithTime(this.instanceId, `✍️ Agent isTyping event received:`, data);
      setAgentIsTyping(data.isTyping);
    };

    // Register handlers
    this.socket.on("connect", connectHandler);
    this.socket.on("disconnect", disconnectHandler);
    this.socket.on("connect_error", connectErrorHandler);
    this.socket.on("reconnect_failed", reconnectFailedHandler);
    this.socket.on("conversationHistory", conversationHistoryHandler);
    this.socket.on("messageSent", messageSentHandler);
    this.socket.on("agentReplied", agentRepliedHandler);
    this.socket.on("agentIsTyping", agentIsTypingHandler);

    // Store handlers for cleanup
    this.eventHandlers.set("connect", connectHandler);
    this.eventHandlers.set("disconnect", disconnectHandler);
    this.eventHandlers.set("connect_error", connectErrorHandler);
    this.eventHandlers.set("reconnect_failed", reconnectFailedHandler);
    this.eventHandlers.set("conversationHistory", conversationHistoryHandler);
    this.eventHandlers.set("messageSent", messageSentHandler);
    this.eventHandlers.set("agentReplied", agentRepliedHandler);
    this.eventHandlers.set("agentIsTyping", agentIsTypingHandler);
  }

  // --- Helper to remove all listeners (prevent duplicates) ---
  private removeAllListeners(): void {
    if (!this.socket) return;

    const handlersCount = this.eventHandlers.size;
    logWithTime(
      this.instanceId,
      `🧹 CLEANING UP ${handlersCount} event listeners for socket ID: ${this.socket.id}`
    );

    // Remove all registered event handlers properly
    this.eventHandlers.forEach((handler, eventName) => {
      if (eventName === "__debug__") {
        this.socket?.offAny(handler as any);
        logWithTime(this.instanceId, `🧹 Removed debug handler (onAny)`);
      } else {
        this.socket?.off(eventName, handler as any);
        logWithTime(this.instanceId, `🧹 Removed handler: ${eventName}`);
      }
    });

    // Clear the handlers map
    this.eventHandlers.clear();
  }

  // --- Methods to send events to the Server ---

  public emitSendMessage(content: string, tempId: string): void {
    if (this.socket?.connected) {
      logWithTime(this.instanceId, `📤 Emitting sendMessage`);
      this.socket.emit("sendMessage", { content, tempId });
    } else {
      errorWithTime(
        this.instanceId,
        `⚠️ Cannot emit sendMessage: socket not connected`
      );
    }
  }

  public emitVisitorIsTyping(isTyping: boolean): void {
    if (this.socket?.connected) {
      logWithTime(this.instanceId, `📤 Emitting visitorIsTyping`);
      this.socket.emit("visitorIsTyping", { isTyping });
    } else {
      errorWithTime(
        this.instanceId,
        `⚠️ Cannot emit visitorIsTyping: socket not connected`
      );
    }
  }

  public emitIdentify(projectId: string, visitorUid: string): void {
    if (this.socket?.connected) {
      logWithTime(this.instanceId, `📤 Emitting identify`);
      this.socket.emit("identify", { projectId, visitorUid });
    } else {
      errorWithTime(
        this.instanceId,
        `⚠️ Cannot emit identify: socket not connected`
      );
    }
  }

  public emitUpdateContext(currentUrl: string): void {
    logWithTime(this.instanceId, `📤 Trying to emitting updateContext`);
    const now = Date.now();
    if (this.socket?.connected) {
      logWithTime(this.instanceId, `📤 Emitting updateContext`);
      this.socket.emit("updateContext", { currentUrl });
      this.lastContextUpdate = now;
    } else {
      errorWithTime(
        this.instanceId,
        `⚠️ Cannot emit updateContext: socket not connected`
      );
    }
  }

  public disconnect(): void {
    logWithTime(this.instanceId, `🔌 Entering disconnect() method.`);
    if (!this.socket) {
      errorWithTime(
        this.instanceId,
        `⚠️ Disconnect IGNORED: no socket instance to disconnect | connectionCount: ${this.connectionCount}, disconnectionCount: ${this.disconnectionCount}`
      );
      return;
    }

    const socketId = this.socket.id;
    this.removeAllListeners();

    logWithTime(
      this.instanceId,
      `🔌 Disconnecting and closing socket ID: ${socketId}...`
    );
    this.socket.disconnect();
    this.socket.close(); // Force close the socket

    this.socket = null;
    this.isConnecting = false;
    logWithTime(
      this.instanceId,
      `✅ Socket instance set to null | Final stats: ${this.connectionCount} total connections, ${this.disconnectionCount} total disconnections`
    );
  }
}

// Export a single instance (singleton) for the entire widget to use
export const socketService = new SocketService();
