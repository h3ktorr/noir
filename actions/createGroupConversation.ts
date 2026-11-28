"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function createGroupConversation(
  name: string,
  memberIds: string[],
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const groupName = name.trim();
  const uniqueMemberIds = [...new Set(memberIds)].filter(
    (id) => id && id !== userId,
  );

  if (groupName.length < 1 || groupName.length > 50) {
    return {
      success: false,
      error: "Group name must be between 1 and 50 characters.",
    };
  }

  if (uniqueMemberIds.length < 2) {
    return {
      success: false,
      error: "Select at least two other people to create a group.",
    };
  }

  if (uniqueMemberIds.length > 99) {
    return {
      success: false,
      error: "A group can have at most 100 members, including you.",
    };
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueMemberIds },
    },
    select: { id: true },
  });

  if (users.length !== uniqueMemberIds.length) {
    return {
      success: false,
      error: "One or more selected users could not be found.",
    };
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockerId: userId,
          blockedId: { in: uniqueMemberIds },
        },
        {
          blockerId: { in: uniqueMemberIds },
          blockedId: userId,
        },
      ],
    },
    select: { id: true },
  });

  if (block) {
    return {
      success: false,
      error: "You cannot create a group with one or more selected users.",
    };
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: groupName,
      createdById: userId,
      participants: {
        create: [
          {
            userId,
            role: "ADMIN",
          },
          ...uniqueMemberIds.map((memberId) => ({
            userId: memberId,
            role: "MEMBER" as const,
          })),
        ],
      },
    },
    select: {
      id: true,
    },
  });

  return {
    success: true,
    conversationId: conversation.id,
  };
}
