"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getStories() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const now = new Date();

  const viewer = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      createdAt: true,
    },
  });

  if (!viewer) {
    return [];
  }

  const twentyFourHours = 24 * 60 * 60 * 1000;

  const canSeeWelcomeStory =
    now.getTime() - viewer.createdAt.getTime() < twentyFourHours;

  // Find accounts the current user follows.
  const following = await prisma.follow.findMany({
    where: {
      followerId: userId,
    },
    select: {
      followingId: true,
    },
  });

  const followingIds = following.map((follow) => follow.followingId);

  // Find users blocked in either direction.
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedIds = new Set(
    blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    ),
  );

  // Retrieve accounts with stories the viewer is allowed to see.
  const users = await prisma.user.findMany({
    where: {
      id: {
        notIn: [...blockedIds],
      },
      OR: [
        { isOfficial: true },
        { id: userId },
        {
          stories: {
            some: {
              visibility: "PUBLIC",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
        {
          id: {
            in: followingIds,
          },
          stories: {
            some: {
              visibility: "FOLLOWERS",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          },
        },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      img: true,
      isOfficial: true,
      stories: {
        where: {
          AND: [
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            {
              OR: [
                { visibility: "PUBLIC" },
                {
                  visibility: "FOLLOWERS",
                  userId: {
                    in: [...followingIds, userId],
                  },
                },
              ],
            },
            ...(!canSeeWelcomeStory
              ? [
                  {
                    NOT: {
                      isWelcome: true,
                      user: {
                        is: {
                          isOfficial: true,
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          visibility: true,
          isWelcome: true,
          createdAt: true,
          expiresAt: true,
          views: {
            where: {
              viewerId: userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  // Sort Noir Official first, then the current user's stories.
  return users
    .filter((user) => user.id === userId || user.stories.length > 0)
    .sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) {
        return a.isOfficial ? -1 : 1;
      }

      if (a.id === userId) return -1;
      if (b.id === userId) return 1;

      return 0;
    });
}
