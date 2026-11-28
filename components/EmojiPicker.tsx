
"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

const emojis = [
  "😀", "😃", "😄", "😁", "😂", "🤣",
  "😊", "😍", "🥰", "😘", "😉", "😎",
  "🥳", "😭", "😢", "😡", "🤔", "🤗",
  "❤️", "💕", "💖", "💯", "🔥", "✨",
  "👍", "👎", "👏", "🙌", "🙏", "💪",
  "🎉", "🎂", "🌹", "☀️", "🌙", "💐",
];

const EmojiPicker = ({
  onSelect,
  disabled = false,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        disabled={disabled}
        title="Add emoji"
        aria-label="Add emoji"
        aria-expanded={isOpen}
        className="cursor-pointer disabled:opacity-50"
      >
        <Smile size={22} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-30 mb-3 w-64 rounded-xl border border-foreground/20 bg-background p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Choose an emoji</p>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-foreground/60 hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="h-9 w-9 rounded-lg text-xl hover:bg-foreground/10 transition-colors"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
