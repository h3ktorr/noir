import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userProfileId = searchParams.get("user");
  const page = Number(searchParams.get("cursor") ?? "2");

  const LIMIT = 3;

  if (!Number.isInteger(page) || page < 1) {
    return Response.json({ message: "Invalid cursor" }, { status: 400 });
  }

  const isProfileFeed = Boolean(userProfileId && userProfileId !== "undefined");

  // Find users involved in a block relationship with the current user.
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedUserIds = blocks.map((block) =>
    block.blockerId === userId ? block.blockedId : block.blockerId,
  );

  // Return no posts if either person has blocked the other.
  if (isProfileFeed && blockedUserIds.includes(userProfileId!)) {
    return Response.json({
      post: [],
      hasMore: false,
    });
  }

  let allowedUserIds: string[] = [];

  if (!isProfileFeed) {
    const follows = await prisma.follow.findMany({
      where: {
        followerId: userId,
        followingId: {
          notIn: blockedUserIds,
        },
      },
      select: {
        followingId: true,
      },
    });

    allowedUserIds = [userId, ...follows.map((follow) => follow.followingId)];
  }

  const whereCondition = {
    parentPostId: null,
    userId: isProfileFeed ? userProfileId! : { in: allowedUserIds },

    // Exclude reposts of posts written by blocked users.
    ...(blockedUserIds.length > 0
      ? {
          OR: [
            { rePostId: null },
            {
              rePost: {
                is: {
                  userId: {
                    notIn: blockedUserIds,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const post = await prisma.post.findMany({
    where: whereCondition,
    include: {
      user: {
        select: {
          displayName: true,
          username: true,
          img: true,
        },
      },
      rePost: {
        include: {
          user: {
            select: {
              displayName: true,
              username: true,
              img: true,
            },
          },
          _count: {
            select: {
              likes: true,
              rePosts: true,
              comments: true,
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
          rePosts: {
            where: { userId },
            select: { id: true },
          },
          saves: {
            where: { userId },
            select: { id: true },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          rePosts: true,
          comments: true,
        },
      },
      likes: {
        where: { userId },
        select: { id: true },
      },
      rePosts: {
        where: { userId },
        select: { id: true },
      },
      saves: {
        where: { userId },
        select: { id: true },
      },
    },
    take: LIMIT,
    skip: (page - 1) * LIMIT,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPosts = await prisma.post.count({
    where: whereCondition,
  });

  const hasMore = page * LIMIT < totalPosts;

  return Response.json({ post, hasMore });
}
