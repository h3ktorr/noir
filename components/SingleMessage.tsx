
"use client";

import {
  Phone,
  Video,
  EllipsisVertical,
  Send,
  ImagePlus,
  X,
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

type Conversation = NonNullable<
  Awaited<ReturnType<typeof getConversation>>
>;

type MediaType = "IMAGE" | "VIDEO";

type TypingPayload = {
  conversationId: string;
  userId: string;
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

  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isTypingRef = useRef(false);

  // Synchronize messages when the selected conversation changes.
  useEffect(() => {
    setMessages(conversation?.messages ?? []);
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

    const joinConversation = () => {
      setTypingUserIds([]);

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

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("connect", joinConversation);

    if (socket.connected) {
      joinConversation();
    }

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("connect", joinConversation);

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

  // Mark the selected conversation as read.
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
  }, [conversation?.id, router]);

  // Clean up media preview URLs.
  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

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
        if (previousMessages.some((message) => message.id === sentMessage.id)) {
          return previousMessages;
        }

        return [...previousMessages, sentMessage];
      });

      setContent("");
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
    <div className="w-1/2 flex-col h-full hidden lg:flex">
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
          <EllipsisVertical size={20} />
        </div>
      </div>

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

            return (
              <div
                key={message.id}
                className={`flex ${
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

                  <span className="block text-[10px] mt-2 opacity-60 text-right">
                    {hasMounted
                      ? formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })
                      : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

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

        <input
          type="text"
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder="Type a message..."
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
