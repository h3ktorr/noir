
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Ban, Flag, Loader2 } from "lucide-react";
import { blockUser, unblockUser, reportUser } from "@/action";

type Props = {
  userId: string;
  username: string;
  isBlocked: boolean;
};

const ProfileActions = ({ userId, username, isBlocked }: Props) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(isBlocked);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [description, setDescription] = useState("");

  const handleBlock = async () => {
    const confirmed = window.confirm(
      blocked
        ? `Unblock @${username}?`
        : `Block @${username}? They will no longer be able to follow you or view your profile.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const result = blocked
        ? await unblockUser(userId)
        : await blockUser(userId);

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      setBlocked(!blocked);
      setOpen(false);
      router.refresh();
    } catch {
      window.alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    setLoading(true);

    try {
      const result = await reportUser(
        userId,
        reason,
        description
      );

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert("Report submitted successfully.");
      setShowReport(false);
      setOpen(false);
      setDescription("");
    } catch {
      window.alert("Unable to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Profile actions"
        className="p-2 rounded-full hover:bg-foreground/10 transition"
      >
        <Ellipsis size={22} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-gray-200 bg-background shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={handleBlock}
            disabled={loading}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-foreground/10 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Ban size={17} />
            )}
            {blocked ? "Unblock user" : "Block user"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowReport(true);
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-foreground/10"
          >
            <Flag size={17} />
            Report user
          </button>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Report @{username}</h2>

            <p className="mt-2 text-sm text-foreground/60">
              Why are you reporting this user?
            </p>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 bg-background p-3 text-sm"
            >
              <option value="SPAM">Spam</option>
              <option value="HARASSMENT">Harassment or bullying</option>
              <option value="IMPERSONATION">Impersonation</option>
              <option value="INAPPROPRIATE">Inappropriate content</option>
              <option value="OTHER">Other</option>
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details (optional)"
              maxLength={1000}
              rows={4}
              className="mt-4 w-full resize-none rounded-lg border border-gray-300 bg-background p-3 text-sm"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReport(false)}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm hover:bg-foreground/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReport}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
