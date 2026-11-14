
import { auth } from "@clerk/nextjs/server";
import NotificationsClient from "@/components/NotificationsClient";
import prisma from "@/lib/prisma";

const Page = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const records = await prisma.notification.findMany({
    where: {
      recipientId: userId,
    },
    include: {
      sender: {
        select: {
          username: true,
          img: true,
        },
      },
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: 21,
  });

  const hasMore = records.length > 20;
  const initialRecords = records.slice(0, 20);

  const notifications = initialRecords.map((notification) => ({
    id: notification.id,
    senderUsername: notification.sender.username,
    senderImg: notification.sender.img,
    type:
      notification.type === "LIKE"
        ? ("like" as const)
        : notification.type === "COMMENT"
          ? ("comment" as const)
          : notification.type === "REPOST"
            ? ("rePost" as const)
            : ("follow" as const),
    link: notification.link ?? "/",
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }));

  return (
    <NotificationsClient
      userId={userId}
      initialNotifications={notifications}
      initialHasMore={hasMore}
    />
  );
};

export default Page;
