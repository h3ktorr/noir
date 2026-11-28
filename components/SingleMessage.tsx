
"use client";

import {
  Phone,
  Video,
  EllipsisVertical,
  Send,
  ImagePlus,
  X,
  Trash2,
  Reply,
  Pencil,
} from "lucide-react";
import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import ImageComp from "./ImageComp";
import type { getConversation } from "@/actions/getConversation";
import { sendMessage } from "@/actions/sendMessage";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { socket } from "@/socket";
import { markConversationAsRead } from "@/actions/markConversationAsRead";
import { useRouter } from "next/navigation";
import { deleteMessage } from "@/actions/deleteMessage";
import { editMessage } from "@/actions/editMessage";
import EmojiPicker from "./EmojiPicker";
import { addGroupMembers } from "@/actions/addGroupMembers";

type Conversation = NonNullable<
  Awaited<ReturnType<typeof getConversation>>
>;

type Message = Conversation["messages"][number];
type MediaType = "IMAGE" | "VIDEO";

type TypingPayload = {
  conversationId: string;
  userId: string;
};

type PresenceUser = {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | Date | null;
};

type PresenceInitialPayload = {
  conversationId: string;
  users: PresenceUser[];
};

type PresenceUpdatePayload = {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
};

type ReadPayload = {
  conversationId: string;
  userId: string;
  lastReadAt: string;
};

type SearchUser = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const TYPING_TIMEOUT = 1500;

const SingleMessage = ({
  conversation,
}: {
  conversation: Conversation | null;
}) => {
  const router = useRouter();

  const [messages, setMessages] = useState(
    conversation?.messages ?? [],
  );

  const [hasMounted, setHasMounted] = useState(false);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  const [presence, setPresence] = useState<
    Record<string, PresenceUser>
  >({});

  const [readReceipts, setReadReceipts] = useState<
    Record<string, string | null>
  >(() =>
    Object.fromEntries(
      (conversation?.participants ?? []).map((participant) => [
        participant.id,
        participant.lastReadAt?.toISOString() ?? null,
      ]),
    ),
  );

  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );

  const [editingMessageId, setEditingMessageId] = useState<string | null>(
    null,
  );

  const [editContent, setEditContent] = useState("");

  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  const isCurrentUserAdmin =
  conversation?.participants.some(
    (participant) =>
      participant.id === conversation.currentUserId &&
      participant.role === "ADMIN",
  ) ?? false;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isTypingRef = useRef(false);

  // Synchronize messages and read receipts when the selected conversation changes.
  useEffect(() => {
    setMessages(conversation?.messages ?? []);
    setReplyingTo(null);
    setContent("");
    setEditingMessageId(null);
    setEditContent("");
    setShowGroupDetails(false);

    setReadReceipts(
      Object.fromEntries(
        (conversation?.participants ?? []).map((participant) => [
          participant.id,
          participant.lastReadAt?.toISOString() ?? null,
        ]),
      ),
    );
  }, [conversation]);

  // Conversation socket events.
  useEffect(() => {
    const conversationId = conversation?.id;

    if (!conversationId) return;

    const handleNewMessage = (
      message: Conversation["messages"][number],
    ) => {
      if (message.conversationId !== conversationId) return;

      setMessages((previousMessages) => {
        if (previousMessages.some((item) => item.id === message.id)) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    const handleTypingStart = (payload: TypingPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === conversation.currentUserId) return;

      setTypingUserIds((previous) =>
        previous.includes(payload.userId)
          ? previous
          : [...previous, payload.userId],
      );
    };

    const handleTypingStop = (payload: TypingPayload) => {
      if (payload.conversationId !== conversationId) return;

      setTypingUserIds((previous) =>
        previous.filter((id) => id !== payload.userId),
      );
    };

    const handlePresenceInitial = (
      payload: PresenceInitialPayload,
    ) => {
      if (payload.conversationId !== conversationId) return;

      const users: Record<string, PresenceUser> = {};

      payload.users.forEach((user) => {
        users[user.userId] = user;
      });

      setPresence(users);
    };

    const handlePresenceUpdate = (
      payload: PresenceUpdatePayload,
    ) => {
      setPresence((previous) => ({
        ...previous,
        [payload.userId]: {
          userId: payload.userId,
          isOnline: payload.isOnline,
          lastSeenAt: payload.isOnline
            ? previous[payload.userId]?.lastSeenAt ?? null
            : payload.lastSeenAt,
        },
      }));
    };

    const handleMessagesRead = (payload: ReadPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === conversation.currentUserId) return;

      setReadReceipts((previous) => ({
        ...previous,
        [payload.userId]: payload.lastReadAt,
      }));
    };

    const handleMessageDeleted = (payload: {
      conversationId: string;
      messageId: string;
      deletedAt: string;
    }) => {
      if (payload.conversationId !== conversationId) return;

      const deletedAt = new Date(payload.deletedAt);

      setMessages((previousMessages) =>
        previousMessages.map((message) => ({
          ...message,
          ...(message.id === payload.messageId
            ? {
                content: "This message was deleted",
                mediaUrl: null,
                deletedAt,
              }
            : {}),
          ...(message.replyTo?.id === payload.messageId
            ? {
                replyTo: {
                  ...message.replyTo,
                  content: "This message was deleted",
                  mediaUrl: null,
                  deletedAt,
                },
              }
            : {}),
        })),
      );

      setReplyingTo((previous) =>
        previous?.id === payload.messageId ? null : previous,
      );
    };

    const handleMessageEdited = (payload: {
      conversationId: string;
      messageId: string;
      content: string;
      editedAt: string;
    }) => {
      if (payload.conversationId !== conversationId) return;

      const editedAt = new Date(payload.editedAt);

      setMessages((previousMessages) =>
        previousMessages.map((message) => ({
          ...message,
          ...(message.id === payload.messageId
            ? {
                content: payload.content,
                editedAt,
              }
            : {}),
          ...(message.replyTo?.id === payload.messageId
            ? {
                replyTo: {
                  ...message.replyTo,
                  content: payload.content,
                  editedAt,
                },
              }
            : {}),
        })),
      );

      setReplyingTo((previous) =>
        previous?.id === payload.messageId
          ? {
              ...previous,
              content: payload.content,
              editedAt,
            }
          : previous,
      );
    };

    const joinConversation = () => {
      setTypingUserIds([]);
      setPresence({});

      socket.emit(
        "conversation:join",
        conversationId,
        (result: { success: boolean; error?: string }) => {
          if (!result.success) {
            console.error("Unable to join conversation:", result.error);
          }
        },
      );
    };

    const handleGroupMembersUpdated = (payload: {
      conversationId: string;
    }) => {
      if (payload.conversationId !== conversationId) return;

      // Refresh the conversation so the member list and count are updated.
      router.refresh();

      // Request a fresh presence snapshot, including newly added members.
      joinConversation();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("connect", joinConversation);
    socket.on("presence:initial", handlePresenceInitial);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("messages:read", handleMessagesRead);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:edited", handleMessageEdited);
    socket.on("group:members-updated", handleGroupMembersUpdated);
    if (socket.connected) {
      joinConversation();
    }

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("connect", joinConversation);
      socket.off("presence:initial", handlePresenceInitial);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("messages:read", handleMessagesRead);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:edited", handleMessageEdited);
      socket.off("group:members-updated", handleGroupMembersUpdated);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isTypingRef.current && socket.connected) {
        socket.emit("typing:stop", conversationId);
      }

      isTypingRef.current = false;
      setTypingUserIds([]);

      if (socket.connected) {
        socket.emit("conversation:leave", conversationId);
      }
    };
  }, [conversation?.id, conversation?.currentUserId]);

  // Scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Search for users to add to the group.
  useEffect(() => {
    const query = memberSearch.trim();

    if (
      !showGroupDetails ||
      !conversation?.isGroup ||
      !isCurrentUserAdmin ||
      !query
    ) {
      setSearchResults([]);
      setIsSearchingMembers(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsSearchingMembers(true);

      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to search users.");
        }

        const data = (await response.json()) as {
          users?: SearchUser[];
        };

        if (controller.signal.aborted) return;

        const existingMemberIds = new Set(
          conversation.participants.map((participant) => participant.id),
        );

        setSearchResults(
          (data.users ?? []).filter(
            (user) =>
              !existingMemberIds.has(user.id) &&
              !selectedMembers.some(
                (selected) => selected.id === user.id,
              ),
          ),
        );
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Group member search failed:", error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingMembers(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    memberSearch,
    showGroupDetails,
    conversation,
    isCurrentUserAdmin,
    selectedMembers,
  ]);

  // Mark the conversation as read when it opens or a new message arrives.
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const conversationId = conversation?.id;

    if (!conversationId) return;

    let cancelled = false;

    const markAsRead = async () => {
      try {
        const result = await markConversationAsRead(conversationId);

        if (!cancelled && result.success) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to mark conversation as read:", error);
      }
    };

    markAsRead();

    return () => {
      cancelled = true;
    };
  }, [conversation?.id, latestMessageId, router]);

  // Clean up media preview URLs.
  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const handleEmojiSelect = (emoji: string) => {
    handleContentChange(content + emoji);
    messageInputRef.current?.focus();
  };

  // Stop the typing indicator and clear its timeout.
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current && socket.connected && conversation?.id) {
      socket.emit("typing:stop", conversation.id);
    }

    isTypingRef.current = false;
  };

  // Emit typing events while the user is composing a message.
  const handleContentChange = (value: string) => {
    setContent(value);

    if (!conversation?.id || !socket.connected) return;

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", conversation.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  };

  if (!conversation) {
    return (
      <div className="w-1/2 h-full hidden lg:flex items-center justify-center">
        <p className="text-foreground/60">
          Select a conversation to start messaging.
        </p>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(
    (participant) => participant.id !== conversation.currentUserId,
  );

  const name = conversation.isGroup
    ? conversation.name || "Group conversation"
    : otherParticipant?.displayName ||
      otherParticipant?.username ||
      "Unknown user";

  const image =
    conversation.img ||
    otherParticipant?.img ||
    "general/noAvatar.png";

  const otherParticipantReadAt = otherParticipant
    ? readReceipts[otherParticipant.id]
    : null;

  // Identify the latest outgoing message covered by the recipient's read timestamp.
  const lastSeenMessageId =
    !conversation.isGroup && otherParticipantReadAt
      ? [...messages]
          .reverse()
          .find(
            (message) =>
              message.senderId === conversation.currentUserId &&
              new Date(message.createdAt).getTime() <=
                new Date(otherParticipantReadAt).getTime(),
          )?.id
      : undefined;

  const handleDeleteMessage = async (messageId: string) => {
    if (deletingMessageId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this message for everyone?",
    );

    if (!confirmed) return;

    setDeletingMessageId(messageId);

    try {
      const result = await deleteMessage(messageId);

      if (!result.success) {
        alert(result.error || "Failed to delete message.");
        return;
      }

      // Update immediately for the sender.
      if (!result.deletedAt) {
        alert("Message was deleted, but the timestamp was not returned.");
        return;
      }

      const deletedAt = new Date(result.deletedAt);

      setMessages((previousMessages) =>
        previousMessages.map((message) => ({
          ...message,
          ...(message.id === messageId
            ? {
                content: "This message was deleted",
                mediaUrl: null,
                deletedAt,
              }
            : {}),
          ...(message.replyTo?.id === messageId
            ? {
                replyTo: {
                  ...message.replyTo,
                  content: "This message was deleted",
                  mediaUrl: null,
                  deletedAt,
                },
              }
            : {}),
        })),
      );

      setReplyingTo((previous) =>
        previous?.id === messageId ? null : previous,
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Something went wrong while deleting the message.");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleStartEdit = (message: Message) => {
    if (
      message.senderId !== conversation.currentUserId ||
      message.type !== "TEXT" ||
      message.deletedAt
    ) {
      return;
    }

    setEditingMessageId(message.id);
    setEditContent(message.content ?? "");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmedContent = editContent.trim();

    if (!trimmedContent || isSavingEdit) return;

    setIsSavingEdit(true);

    try {
      const result = await editMessage(messageId, trimmedContent);

      if (!result.success) {
        alert(result.error || "Unable to edit message");
        return;
      }

      if (!result.editedAt) {
        alert("Message was edited, but its updated timestamp was not returned.");
        return;
      }

      const editedAt = new Date(result.editedAt);

      setMessages((previousMessages) =>
        previousMessages.map((message) => ({
          ...message,
          ...(message.id === messageId
            ? {
                content: result.content,
                editedAt,
              }
            : {}),
          ...(message.replyTo?.id === messageId
            ? {
                replyTo: {
                  ...message.replyTo,
                  content: result.content,
                  editedAt,
                },
              }
            : {}),
        })),
      );

      setReplyingTo((previous) =>
        previous?.id === messageId
          ? {
              ...previous,
              content: result.content,
              editedAt,
            }
          : previous,
      );

      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
      alert("Something went wrong while editing the message.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Start replying to a message.
  const handleReply = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  // Cancel the current reply.
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Select or deselect a user to add to the group.
  const handleToggleMember = (user: SearchUser) => {
    setSelectedMembers((previous) => {
      const alreadySelected = previous.some(
        (member) => member.id === user.id,
      );

      if (alreadySelected) {
        return previous.filter((member) => member.id !== user.id);
      }

      return [...previous, user];
    });
  };

  // Add selected users to the group.
  const handleAddMembers = async () => {
    if (
      !conversation?.isGroup ||
      !isCurrentUserAdmin ||
      selectedMembers.length === 0 ||
      isAddingMembers
    ) {
      return;
    }

    setIsAddingMembers(true);

    try {
      const result = await addGroupMembers(
        conversation.id,
        selectedMembers.map((member) => member.id),
      );

      if (!result.success) {
        alert(result.error || "Unable to add group members.");
        return;
      }

      alert(
        `${result.addedCount} member${result.addedCount === 1 ? "" : "s"} added successfully.`,
      );

      setSelectedMembers([]);
      setMemberSearch("");
      setSearchResults([]);

      router.refresh();
    } catch (error) {
      console.error("Failed to add group members:", error);
      alert("Something went wrong while adding group members.");
    } finally {
      setIsAddingMembers(false);
    }
  };

  // Jump to the original message from a quoted preview.
  const handleJumpToMessage = (messageId: string) => {
    const originalElement = document.getElementById(
      `message-${messageId}`,
    );

    if (!originalElement) return;

    originalElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    originalElement.classList.add("ring-2", "ring-foreground/50");

    setTimeout(() => {
      originalElement.classList.remove(
        "ring-2",
        "ring-foreground/50",
      );
    }, 1500);
  };

  const getMessagePreview = (
    message: Pick<Message, "content" | "type">,
  ) => {
    if (message.content) return message.content;
    if (message.type === "IMAGE") return "Photo";
    if (message.type === "VIDEO") return "Video";
    return "Message";
  };

  const handleMediaChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");

    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      alert("Please select an image or an MP4, WebM, or MOV video.");
      event.target.value = "";
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      alert("Image size must be 10MB or less.");
      event.target.value = "";
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      alert("Video size must be 50MB or less.");
      event.target.value = "";
      return;
    }

    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);

    if (mediaInputRef.current) {
      mediaInputRef.current.value = "";
    }
  };

  const authenticator = async () => {
    const response = await fetch("/api/upload-auth");

    if (!response.ok) {
      throw new Error("ImageKit authentication failed.");
    }

    return response.json() as Promise<{
      signature: string;
      expire: number;
      token: string;
      publicKey: string;
    }>;
  };

  const handleSendMessage = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSending || isUploadingMedia) return;
    if (!content.trim() && !selectedMedia) return;

    // Stop typing immediately when sending.
    stopTyping();

    const messageContent = content.trim();
    const replyToId = replyingTo?.id;

    setIsSending(true);

    try {
      let mediaUrl: string | undefined;
      let mediaType: MediaType | undefined;

      if (selectedMedia) {
        setIsUploadingMedia(true);

        mediaType = selectedMedia.type.startsWith("image/")
          ? "IMAGE"
          : "VIDEO";

        const authParams = await authenticator();

        const uploadOptions = {
          ...authParams,
          file: selectedMedia,
          fileName: selectedMedia.name,
          folder: "/messages",
          abortSignal: new AbortController().signal,
        };

        const uploadResponse =
          mediaType === "IMAGE"
            ? await upload({
                ...uploadOptions,
                transformation: {
                  pre: "w-600",
                },
              })
            : await upload(uploadOptions);

        if (
          mediaType === "IMAGE" &&
          uploadResponse.fileType !== "image"
        ) {
          throw new Error("The uploaded file is not an image.");
        }

        if (
          mediaType === "VIDEO" &&
          uploadResponse.fileType !== "non-image"
        ) {
          throw new Error("The uploaded file is not a video.");
        }

        mediaUrl = uploadResponse.url;
      }

      const result = await sendMessage(
        conversation.id,
        messageContent,
        mediaUrl,
        mediaType,
        replyToId,
      );

      if (!("message" in result) || !result.message) {
        console.error(
          "error" in result ? result.error : "Failed to send message",
        );

        alert(
          "error" in result ? result.error : "Failed to send message.",
        );

        return;
      }

      const sentMessage = result.message;

      setMessages((previousMessages) => {
        if (
          previousMessages.some(
            (message) => message.id === sentMessage.id,
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, sentMessage];
      });

      setContent("");
      setReplyingTo(null);
      handleRemoveMedia();
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid upload request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Upload network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("ImageKit server error:", error.message);
      } else {
        console.error("Failed to send message:", error);
      }

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while sending your message.",
      );
    } finally {
      setIsSending(false);
      setIsUploadingMedia(false);
    }
  };

  return (
    <div className="w-1/2 flex-col h-full hidden lg:flex relative">
      {/* Messages Header */}
      <div className="flex items-center justify-between p-4 border-b border-foreground">
        <div className="flex items-center min-w-0">
          <ImageComp
            src={image}
            alt={name}
            w={48}
            h={48}
            className="w-12 h-12 rounded-full mr-4"
          />

          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>

            {!conversation.isGroup && otherParticipant && (
              <p className="text-xs text-foreground/60">
                {presence[otherParticipant.id]?.isOnline ? (
                  <span className="text-green-500">Online</span>
                ) : presence[otherParticipant.id]?.lastSeenAt ? (
                  <>
                    Last seen{" "}
                    {hasMounted
                      ? formatDistanceToNow(
                          new Date(
                            presence[otherParticipant.id].lastSeenAt!,
                          ),
                          { addSuffix: true },
                        )
                      : "recently"}
                  </>
                ) : (
                  "Offline"
                )}
              </p>
            )}

            {conversation.isGroup && (
              <p className="text-xs text-foreground/60">
                {conversation.participants.length} members
                {" · "}
                {
                  Object.values(presence).filter(
                    (user) =>
                      user.isOnline &&
                      user.userId !== conversation.currentUserId,
                  ).length
                }{" "}
                online
              </p>
            )}

            {typingUserIds.length > 0 && (
              <p className="text-xs text-foreground/60 animate-pulse">
                {conversation.isGroup
                  ? typingUserIds.length > 1
                    ? "Several people are typing..."
                    : "Someone is typing..."
                  : "Typing..."}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center shrink-0">
          <Phone size={20} />
          <Video size={20} />

          {conversation.isGroup && (
            <button
              type="button"
              onClick={() =>
                setShowGroupDetails((previous) => !previous)
              }
              className="cursor-pointer hover:opacity-60"
              title="Group details"
              aria-label="Toggle group details"
              aria-expanded={showGroupDetails}
            >
              <EllipsisVertical size={20} />
            </button>
          )}
        </div>
      </div>

      {conversation.isGroup && showGroupDetails && (
        <div className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100%-2rem)] rounded-xl border border-foreground/20 bg-background shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-foreground/10">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {conversation.name || "Group conversation"}
              </p>

              <p className="text-xs text-foreground/60">
                {conversation.participants.length} members
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGroupDetails(false)}
              className="p-1 rounded-full hover:bg-foreground/10"
              title="Close group details"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {isCurrentUserAdmin && (
              <div className="mb-5">
                <p className="text-sm font-semibold mb-3">
                  Add members
                </p>

                <input
                  type="text"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search by username..."
                  disabled={isAddingMembers}
                  className="w-full p-2 text-sm rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:border-foreground"
                />

                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedMembers.map((member) => (
                      <span
                        key={member.id}
                        className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-foreground/10"
                      >
                        @{member.username}

                        <button
                          type="button"
                          onClick={() => handleToggleMember(member)}
                          disabled={isAddingMembers}
                          className="hover:opacity-60 disabled:opacity-40"
                          title={`Remove ${member.username} from selection`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {memberSearch.trim() && (
                  <div className="mt-2 max-h-40 overflow-y-auto flex flex-col gap-2">
                    {isSearchingMembers ? (
                      <p className="text-xs text-foreground/50 py-2">
                        Searching...
                      </p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleToggleMember(user)}
                          disabled={isAddingMembers}
                          className="flex items-center gap-3 p-2 rounded-lg text-left hover:bg-foreground/10 transition-colors disabled:opacity-50"
                        >
                          <div className="w-8 h-8 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold">
                            {(user.displayName || user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.displayName || user.username}
                            </p>

                            <p className="text-xs text-foreground/50 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-foreground/50 py-2">
                        No available users found.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={
                    selectedMembers.length === 0 ||
                    isAddingMembers
                  }
                  className="w-full mt-3 p-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAddingMembers
                    ? "Adding members..."
                    : `Add ${selectedMembers.length > 0 ? selectedMembers.length : ""} ${selectedMembers.length === 1 ? "member" : "members"}`}
                </button>
              </div>
            )}

            <p className="text-sm font-semibold mb-3">
              Group members
            </p>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-3">
              {conversation.participants.map((participant) => {
                const participantName =
                  participant.displayName ||
                  participant.username ||
                  "Unknown user";

                const isCurrentUser =
                  participant.id === conversation.currentUserId;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-semibold">
                      {participantName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participantName}
                          {isCurrentUser && (
                            <span className="text-xs text-foreground/50 ml-2">
                              You
                            </span>
                          )}
                        </p>

                        {participant.role === "ADMIN" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 shrink-0">
                            Admin
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-foreground/50 truncate">
                        @{participant.username}
                      </p>
                    </div>

                    {presence[participant.id]?.isOnline && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messages Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-foreground/60">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOutgoing =
              message.senderId === conversation.currentUserId;

            const isSeen = message.id === lastSeenMessageId;

            const replySenderName =
              message.replyTo?.sender.displayName ||
              message.replyTo?.sender.username ||
              "Unknown user";

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex transition-shadow duration-300 rounded-2xl ${
                  isOutgoing ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-4 rounded-2xl ${
                    isOutgoing
                      ? "bg-foreground text-background rounded-tr-none"
                      : "bg-foreground/10 rounded-tl-none"
                  }`}
                >
                  {conversation.isGroup && !isOutgoing && (
                    <p className="text-xs font-semibold mb-2 opacity-70">
                      {message.sender.displayName ||
                        message.sender.username ||
                        "Unknown user"}
                    </p>
                  )}
                  {/* Quoted original message */}
                  {message.replyTo && (
                    <button
                      type="button"
                      onClick={() =>
                        handleJumpToMessage(message.replyTo!.id)
                      }
                      className={`w-full text-left mb-3 p-2 rounded-lg border-l-4 ${
                        isOutgoing
                          ? "bg-background/15 border-background/60"
                          : "bg-foreground/10 border-foreground/50"
                      }`}
                      title="Jump to original message"
                    >
                      <span className="block text-xs font-semibold mb-1">
                        {replySenderName}
                      </span>

                      <span className="block text-xs opacity-80 line-clamp-2 wrap-break-word">
                        {getMessagePreview(message.replyTo)}
                      </span>
                    </button>
                  )}

                  {message.deletedAt ? (
                    <p className="text-sm italic opacity-60">
                      This message was deleted
                    </p>
                  ) : editingMessageId === message.id ? (
                    <div className="flex flex-col gap-2 min-w-0">
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={3}
                        autoFocus
                        disabled={isSavingEdit}
                        className="w-full min-w-0 p-2 rounded-lg bg-background text-foreground border border-foreground/30 focus:outline-none focus:border-foreground resize-y text-sm"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="text-xs px-3 py-1 rounded-full border border-background/30 hover:bg-background/10 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveEdit(message.id)}
                          disabled={!editContent.trim() || isSavingEdit}
                          className="text-xs px-3 py-1 rounded-full bg-background text-foreground hover:opacity-80 disabled:opacity-50"
                        >
                          {isSavingEdit ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.mediaUrl && message.type === "IMAGE" && (
                        <a
                          href={message.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={message.mediaUrl}
                            alt="Shared image"
                            className="max-w-full max-h-72 rounded-lg object-contain mb-2"
                          />
                        </a>
                      )}

                      {message.mediaUrl && message.type === "VIDEO" && (
                        <video
                          src={message.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="max-w-full max-h-72 rounded-lg mb-2"
                        >
                          Your browser does not support video playback.
                        </video>
                      )}

                      {message.content && (
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {message.content}
                        </p>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleReply(message)}
                        disabled={isSending || !!message.deletedAt}
                        className="flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
                        title="Reply to message"
                      >
                        <Reply size={13} />
                        Reply
                      </button>

                      {isOutgoing &&
                        message.type === "TEXT" &&
                        !message.deletedAt && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(message)}
                            disabled={editingMessageId !== null || deletingMessageId !== null}
                            className="flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
                            title="Edit message"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                        )}

                      {isOutgoing && !message.deletedAt && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={
                            deletingMessageId !== null || editingMessageId !== null
                          }
                          className="flex items-center gap-1 text-[10px] text-red-500 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                          title="Delete message for everyone"
                        >
                          <Trash2 size={13} />
                          {deletingMessageId === message.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] opacity-60">
                      {message.editedAt && !message.deletedAt && (
                        <span>Edited</span>
                      )}

                      <span className="text-right">
                        {hasMounted
                          ? formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                  </div>

                  {isSeen && (
                    <p className="text-[10px] mt-1 text-right opacity-70">
                      Seen
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 pt-3 border-t border-foreground/20">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-foreground/5">
            <div className="min-w-0 border-l-4 border-foreground/50 pl-3">
              <p className="text-xs font-semibold mb-1">
                Replying to{" "}
                {replyingTo.sender.displayName ||
                  replyingTo.sender.username}
              </p>

              <p className="text-xs text-foreground/60 truncate">
                {getMessagePreview(replyingTo)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelReply}
              disabled={isSending}
              className="shrink-0 p-1 rounded-full hover:bg-foreground/10 disabled:opacity-50"
              title="Cancel reply"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Media Preview */}
      {selectedMedia && mediaPreview && (
        <div className="px-4 pt-3 border-t border-foreground/20">
          <div className="relative w-36">
            {selectedMedia.type.startsWith("image/") ? (
              <img
                src={mediaPreview}
                alt="Selected image preview"
                className="w-full h-24 object-cover rounded-lg"
              />
            ) : (
              <video
                src={mediaPreview}
                controls
                className="w-full max-h-32 rounded-lg"
              />
            )}

            <button
              type="button"
              onClick={handleRemoveMedia}
              disabled={isSending}
              className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 disabled:opacity-50"
              title="Remove attachment"
            >
              <X size={14} />
            </button>

            <p className="text-xs mt-1 truncate">
              {selectedMedia.name}
            </p>
          </div>
        </div>
      )}

      {/* Messages Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-foreground bottom-0 flex items-center gap-3"
      >
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          onChange={handleMediaChange}
          className="hidden"
          disabled={isSending}
        />

        <button
          type="button"
          onClick={() => mediaInputRef.current?.click()}
          disabled={isSending}
          title="Attach image or video"
          className="cursor-pointer disabled:opacity-50"
        >
          <ImagePlus size={22} />
        </button>

        <EmojiPicker
          onSelect={handleEmojiSelect}
          disabled={isSending}
        />

        <input
          ref={messageInputRef}
          type="text"
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder={
            replyingTo ? "Write a reply..." : "Type a message..."
          }
          disabled={isSending}
          className="w-full p-2 border border-foreground rounded-full bg-background text-foreground focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={
            (!content.trim() && !selectedMedia) ||
            isSending ||
            isUploadingMedia
          }
          className="cursor-pointer bg-foreground text-background p-3 rounded-full disabled:opacity-50"
          title={
            isUploadingMedia
              ? "Uploading media..."
              : "Send message"
          }
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default SingleMessage;
