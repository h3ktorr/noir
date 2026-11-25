"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getUnreadMessageCount() {
  const { userId } = await auth();

  if (!userId) return 0;

  const participants = await prisma.conversationParticipant.findMany({
    where: {
      userId,
      archivedAt: null,
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  const counts = await Promise.all(
    participants.map((participant) =>
      prisma.message.count({
        where: {
          conversationId: participant.conversationId,
          senderId: { not: userId },
          deletedAt: null,
          ...(participant.lastReadAt
            ? { createdAt: { gt: participant.lastReadAt } }
            : {}),
        },
      }),
    ),
  );

  return counts.reduce((total, count) => total + count, 0);
}
