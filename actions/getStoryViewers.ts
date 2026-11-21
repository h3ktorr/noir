"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getStoryViewers(storyId: number) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "Not authenticated",
      viewers: [],
      totalViews: 0,
    };
  }

  // Verify that the requesting user owns this story.
  const story = await prisma.story.findUnique({
    where: {
      id: storyId,
    },
    select: {
      userId: true,
    },
  });

  if (!story || story.userId !== userId) {
    return {
      success: false,
      message: "Not authorized",
      viewers: [],
      totalViews: 0,
    };
  }

  // Retrieve the viewers and their basic profile information.
  const views = await prisma.storyView.findMany({
    where: {
      storyId,
    },
    orderBy: {
      viewedAt: "desc",
    },
    select: {
      id: true,
      viewedAt: true,
      viewer: {
        select: {
          id: true,
          username: true,
          displayName: true,
          img: true,
        },
      },
    },
  });

  return {
    success: true,
    viewers: views,
    totalViews: views.length,
  };
}
