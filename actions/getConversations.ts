"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getConversations() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId,
          archivedAt: null,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              img: true,
            },
          },
        },
      },
      messages: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return Promise.all(
    conversations.map(async (conversation) => {
      const currentParticipant = conversation.participants.find(
        (participant) => participant.userId === userId,
      );

      const lastReadAt = currentParticipant?.lastReadAt;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: {
            not: userId,
          },
          deletedAt: null,
          ...(lastReadAt
            ? {
                createdAt: {
                  gt: lastReadAt,
                },
              }
            : {}),
        },
      });

      return {
        id: conversation.id,
        isGroup: conversation.isGroup,
        name: conversation.name,
        img: conversation.img,
        updatedAt: conversation.updatedAt,

        participants: conversation.participants
          .filter((participant) => participant.userId !== userId)
          .map((participant) => participant.user),

        lastMessage: conversation.messages[0] ?? null,
        unreadCount,
      };
    }),
  );
}
