
import { getConversations } from "@/actions/getConversations";
import { getConversation } from "@/actions/getConversation";
import AllMessages from "@/components/AllMessages";
import SingleMessage from "@/components/SingleMessage";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) => {
  const { conversationId } = await searchParams;

  const conversations = await getConversations();

  const selectedConversation = conversationId
    ? await getConversation(conversationId)
    : null;

  return (
    <div className="flex w-full flex-1 min-h-0 overflow-hidden">
      <AllMessages conversations={conversations} />
      <SingleMessage conversation={selectedConversation} />
    </div>
  );
};

export default Page;
