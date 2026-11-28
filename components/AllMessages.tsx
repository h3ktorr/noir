"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, X, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import ImageComp from "./ImageComp";
import InboxRealtimeRefresh from "./InboxRealtimeRefresh";
import { getConversations } from "@/actions/getConversations";
import { getOrCreateConversation } from "@/actions/getOrCreateConversation";
import { createGroupConversation } from "@/actions/createGroupConversation";

type Conversations = Awaited<ReturnType<typeof getConversations>>;

type SearchUser = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
};

const AllMessages = ({
  conversations,
}: {
  conversations: Conversations;
}) => {
  const router = useRouter();

  const [inboxQuery, setInboxQuery] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [openingUserId, setOpeningUserId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");

  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const resetNewMessageDialog = () => {
    setIsNewMessageOpen(false);
    setUserQuery("");
    setSearchResults([]);
    setSearchError("");
    setIsGroupMode(false);
    setSelectedUsers([]);
    setGroupName("");
  };

  // Search for users when the new-message dialog is open.
  useEffect(() => {
    if (!isNewMessageOpen) return;

    const query = userQuery.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to search for users.");
        }

        const data = (await response.json()) as {
          users?: SearchUser[];
        };

        setSearchResults(data.users ?? []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("User search failed:", error);
        setSearchResults([]);
        setSearchError(
          "Something went wrong while searching. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [userQuery, isNewMessageOpen]);

  const filteredConversations = conversations.filter((conversation) => {
    const query = inboxQuery.trim().toLowerCase();

    if (!query) return true;

    const participantNames = conversation.participants.flatMap(
      (participant) => [
        participant.displayName || "",
        participant.username || "",
      ],
    );

    const name = conversation.isGroup
      ? conversation.name || "Group conversation"
      : participantNames[0] || "Unknown user";

    const message = conversation.lastMessage?.content ?? "";

    return (
      name.toLowerCase().includes(query) ||
      participantNames.some((value) => value.toLowerCase().includes(query)) ||
      message.toLowerCase().includes(query)
    );
  });

  const handleOpenConversation = async (targetUserId: string) => {
    if (openingUserId || isCreatingGroup) return;

    setOpeningUserId(targetUserId);
    setSearchError("");

    try {
      const result = await getOrCreateConversation(targetUserId);

      if (!result.success) {
        setSearchError(result.error || "Unable to open this conversation.");
        return;
      }

      resetNewMessageDialog();

      router.push(`/messages?conversationId=${result.conversationId}`);
    } catch (error) {
      console.error("Failed to open conversation:", error);
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setOpeningUserId(null);
    }
  };

  const handleToggleSelectedUser = (user: SearchUser) => {
    setSelectedUsers((previous) => {
      const alreadySelected = previous.some(
        (selected) => selected.id === user.id,
      );

      if (alreadySelected) {
        return previous.filter((selected) => selected.id !== user.id);
      }

      return [...previous, user];
    });
  };

  const handleCreateGroup = async () => {
    if (isCreatingGroup || selectedUsers.length < 2 || !groupName.trim()) {
      return;
    }

    setIsCreatingGroup(true);
    setSearchError("");

    try {
      const result = await createGroupConversation(
        groupName,
        selectedUsers.map((user) => user.id),
      );

      if (!result.success) {
        setSearchError(result.error || "Unable to create this group.");
        return;
      }

      resetNewMessageDialog();

      router.push(`/messages?conversationId=${result.conversationId}`);
    } catch (error) {
      console.error("Failed to create group:", error);
      setSearchError("Something went wrong while creating the group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2 h-full border-r flex flex-col relative">
      <InboxRealtimeRefresh />

      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Messages</h1>

          <button
            type="button"
            onClick={() => {
              setIsNewMessageOpen(true);
              setSearchError("");
            }}
            className="flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={17} />
            <span>New message</span>
          </button>
        </div>

        <div className="relative mt-3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
          />

          <input
            type="text"
            value={inboxQuery}
            onChange={(event) => setInboxQuery(event.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-foreground rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search conversations..."
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {filteredConversations.length === 0 ? (
          <p className="text-sm text-foreground/60 text-center mt-6">
            {conversations.length === 0
              ? "You don't have any conversations yet. Start a new message!"
              : "No conversations match your search."}
          </p>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = conversation.participants[0];

            const name = conversation.isGroup
              ? conversation.name || "Group conversation"
              : otherParticipant?.displayName ||
                otherParticipant?.username ||
                "Unknown user";

            const image =
              conversation.img ||
              otherParticipant?.img ||
              "general/noAvatar.png";

            const lastMessage = conversation.lastMessage;

            const messagePreview = !lastMessage
              ? "No messages yet"
              : lastMessage.type === "IMAGE"
                ? "Photo"
                : lastMessage.type === "VIDEO"
                  ? "Video"
                  : lastMessage.content || "Message";

            return (
              <Link
                key={conversation.id}
                href={`/messages?conversationId=${conversation.id}`}
                className="flex items-center mb-4 p-2 hover:bg-foreground/5 rounded-lg cursor-pointer"
              >
                <ImageComp
                  src={image}
                  alt={name}
                  w={48}
                  h={48}
                  className="rounded-full mr-4"
                />

                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{name}</h2>

                  <p className="text-sm text-foreground/60 truncate">
                    {messagePreview}
                  </p>
                </div>

                <div className="ml-2 flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-foreground/50">
                    {formatDistanceToNow(
                      new Date(
                        lastMessage?.createdAt ?? conversation.updatedAt,
                      ),
                      { addSuffix: true },
                    )}
                  </span>

                  {conversation.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {conversation.unreadCount > 99
                        ? "99+"
                        : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {isNewMessageOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[85%] flex flex-col rounded-xl border border-foreground/20 bg-background shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-foreground/20">
              <h2 className="font-semibold text-lg">
                {isGroupMode ? "Create group" : "New message"}
              </h2>

              <button
                type="button"
                onClick={resetNewMessageDialog}
                className="p-1 rounded-full hover:bg-foreground/10"
                aria-label="Close new message dialog"
                disabled={isCreatingGroup}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex gap-2 border-b border-foreground/10">
              <button
                type="button"
                onClick={() => {
                  setIsGroupMode(false);
                  setSelectedUsers([]);
                  setGroupName("");
                  setSearchError("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  !isGroupMode
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 hover:bg-foreground/10"
                }`}
                disabled={isCreatingGroup}
              >
                Direct message
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGroupMode(true);
                  setSearchError("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  isGroupMode
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 hover:bg-foreground/10"
                }`}
                disabled={isCreatingGroup}
              >
                <Users size={16} />
                Create group
              </button>
            </div>

            {isGroupMode && (
              <div className="p-4 pb-0">
                <label
                  htmlFor="group-name"
                  className="block text-sm font-medium mb-2"
                >
                  Group name
                </label>

                <input
                  id="group-name"
                  type="text"
                  maxLength={50}
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Enter a group name..."
                  className="w-full p-3 rounded-lg border border-foreground/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isCreatingGroup}
                />

                <p className="text-xs text-foreground/50 mt-1 text-right">
                  {groupName.length}/50
                </p>

                {selectedUsers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">
                      Selected members ({selectedUsers.length})
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleToggleSelectedUser(user)}
                          disabled={isCreatingGroup}
                          className="flex items-center gap-2 rounded-full bg-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/20 disabled:opacity-50"
                          title={`Remove ${user.username}`}
                        >
                          <span className="max-w-32 truncate">
                            {user.displayName || user.username}
                          </span>
                          <X size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <input
                type="text"
                autoFocus
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search by username..."
                className="w-full p-3 rounded-lg border border-foreground/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isCreatingGroup}
              />

              {searchError && (
                <p className="text-sm text-red-500 mt-3">{searchError}</p>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              {!userQuery.trim() ? (
                <p className="text-sm text-foreground/60 text-center py-6">
                  {isGroupMode
                    ? "Search for people to add to your group."
                    : "Search for someone to start a conversation."}
                </p>
              ) : isSearching ? (
                <p className="text-sm text-foreground/60 text-center py-6">
                  Searching...
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-foreground/60 text-center py-6">
                  No users found.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchResults.map((user) => {
                    const name = user.displayName || user.username;

                    const isSelected = selectedUsers.some(
                      (selected) => selected.id === user.id,
                    );

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() =>
                          isGroupMode
                            ? handleToggleSelectedUser(user)
                            : handleOpenConversation(user.id)
                        }
                        disabled={
                          openingUserId !== null || isCreatingGroup
                        }
                        className={`flex items-center gap-3 p-2 rounded-lg text-left hover:bg-foreground/5 disabled:opacity-50 ${
                          isSelected ? "bg-foreground/10" : ""
                        }`}
                      >
                        <ImageComp
                          src={user.img || "general/noAvatar.png"}
                          alt={name}
                          w={44}
                          h={44}
                          className="rounded-full"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-sm text-foreground/60 truncate">
                            @{user.username}
                          </p>
                        </div>

                        {isGroupMode ? (
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "bg-foreground text-background border-foreground"
                                : "border-foreground/30"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        ) : openingUserId === user.id ? (
                          <span className="text-xs text-foreground/60">
                            Opening...
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {isGroupMode && (
              <div className="p-4 border-t border-foreground/20">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={
                    isCreatingGroup ||
                    selectedUsers.length < 2 ||
                    !groupName.trim()
                  }
                  className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {isCreatingGroup
                    ? "Creating group..."
                    : `Create group (${selectedUsers.length + 1} members)`}
                </button>

                {selectedUsers.length < 2 && (
                  <p className="text-xs text-foreground/50 text-center mt-2">
                    Select at least two other people.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllMessages;