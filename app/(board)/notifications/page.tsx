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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const notifications = records.map((notification) => ({
    id: notification.id,
    senderUsername: notification.sender.username,
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
    />
  );
};

export default Page;