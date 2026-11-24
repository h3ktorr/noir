
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getOrCreateConversation } from "@/actions/getOrCreateConversation";

const MessageButton = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessage = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await getOrCreateConversation(userId);

      if (!result.success) {
        console.error(result.error);
        return;
      }

      router.push(`/messages?conversationId=${result.conversationId}`);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMessage}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full border border-foreground/30 px-4 py-2 text-sm font-semibold hover:bg-foreground/5 disabled:opacity-50"
    >
      <MessageCircle size={17} />
      {isLoading ? "Opening..." : "Message"}
    </button>
  );
};

export default MessageButton;
