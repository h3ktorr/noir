
"use client";

import { Phone, Video, EllipsisVertical, Send } from "lucide-react";
import ImageComp from "./ImageComp";
import type { getConversation } from "@/actions/getConversation";
import { sendMessage } from "@/actions/sendMessage";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";

type Conversation = NonNullable<
  Awaited<ReturnType<typeof getConversation>>
>;

const SingleMessage = ({
  conversation,
}: {
  conversation: Conversation | null;
}) => {
  const [messages, setMessages] = useState(
    conversation?.messages ?? [],
  );
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(conversation?.messages ?? []);
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendMessage = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!content.trim() || isSending) return;

    setIsSending(true);

    try {
      const result = await sendMessage(
        conversation.id,
        content,
      );

      if (!("message" in result) || !result.message) {
        console.error(
          "error" in result ? result.error : "Failed to send message",
        );
        return;
      }

      const sentMessage = result.message;

      setMessages((previousMessages) => [
        ...previousMessages,
        sentMessage,
      ]);

      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
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
          <p className="font-medium truncate">{name}</p>
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
                  {message.content && (
                    <p className="whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                  )}

                  {message.type === "IMAGE" && (
                    <p className="text-sm">Photo</p>
                  )}

                  {message.type === "VIDEO" && (
                    <p className="text-sm">Video</p>
                  )}

                  <span className="block text-[10px] mt-2 opacity-60 text-right">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Messages Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-foreground bottom-0 flex items-center"
      >
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="w-full p-2 border border-foreground rounded-full bg-background text-foreground focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!content.trim() || isSending}
          className="cursor-pointer ml-4 bg-foreground text-background p-3 rounded-full disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default SingleMessage;
