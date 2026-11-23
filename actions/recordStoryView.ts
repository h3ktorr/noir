"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function recordStoryView(storyId: number) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "Not authenticated",
      shouldMarkViewed: false,
    };
  }

  // Find the story and its owner.
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      id: true,
      userId: true,
      visibility: true,
      expiresAt: true,
      isWelcome: true,
      user: {
        select: {
          isOfficial: true,
        },
      },
    },
  });

  if (!story) {
    return {
      success: false,
      message: "Story not found",
      shouldMarkViewed: false,
    };
  }

  // Expired stories cannot receive views.
  if (story.expiresAt && story.expiresAt <= new Date()) {
    return {
      success: false,
      message: "Story has expired",
      shouldMarkViewed: false,
    };
  }

  if (story.isWelcome && story.user.isOfficial) {
    const viewer = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        createdAt: true,
      },
    });

    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (
      !viewer ||
      new Date().getTime() - viewer.createdAt.getTime() >= twentyFourHours
    ) {
      return {
        success: false,
        message: "Welcome story is no longer available",
        shouldMarkViewed: false,
      };
    }
  }

  // Do not count the owner's own views.
  if (story.userId === userId) {
    return { success: true, shouldMarkViewed: false };
  }

  // Check whether either account has blocked the other.
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: story.userId },
        { blockerId: story.userId, blockedId: userId },
      ],
    },
    select: { id: true },
  });

  if (block) {
    return {
      success: false,
      message: "Access denied",
      shouldMarkViewed: false,
    };
  }

  // Followers-only stories require an active follow relationship.
  const isPublic =
    story.visibility === "PUBLIC" || (story.isWelcome && story.user.isOfficial);

  if (!isPublic) {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: story.userId,
      },
      select: { followerId: true },
    });

    if (!follow) {
      return {
        success: false,
        message: "Access denied",
        shouldMarkViewed: false,
      };
    }
  }

  // Create one view per viewer per story.
  await prisma.storyView.upsert({
    where: {
      storyId_viewerId: {
        storyId,
        viewerId: userId,
      },
    },
    update: {},
    create: {
      storyId,
      viewerId: userId,
    },
  });

  return { success: true, shouldMarkViewed: true };
}
