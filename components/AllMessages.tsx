
import ImageComp from "./ImageComp";
import { getConversations } from "@/actions/getConversations";
import { formatDistanceToNow } from "date-fns";

type Conversations = Awaited<ReturnType<typeof getConversations>>;

const AllMessages = ({
  conversations,
}: {
  conversations: Conversations;
}) => {
  return (
    <div className="w-full lg:w-1/2 h-full border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Messages</h1>

        <input
          type="text"
          className="w-full p-2 border border-foreground rounded mt-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search messages..."
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <p className="text-sm text-foreground/60 text-center mt-6">
            You don't have any conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => {
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
              <div
                key={conversation.id}
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

                <span className="ml-2 text-xs text-foreground/50 shrink-0">
                  {formatDistanceToNow(
                    new Date(
                      lastMessage?.createdAt ?? conversation.updatedAt,
                    ),
                    { addSuffix: true },
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllMessages;
