
import prisma from "@/lib/prisma";
import Post from "./Post";
import { auth } from "@clerk/nextjs/server";
import InfiniteFeed from "./InfiniteFeed";

const Feed = async ({ userProfileId }: { userProfileId?: string }) => {
  const { userId } = await auth();

  if (!userId) return null;

  // Find every user involved in a block relationship with the current user.
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedUserIds = blocks.map((block) =>
    block.blockerId === userId ? block.blockedId : block.blockerId
  );

  // Don't show a profile feed if either person has blocked the other.
  if (userProfileId && blockedUserIds.includes(userProfileId)) {
    return (
      <div className="mx-auto max-w-xl px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">Profile unavailable</h2>
        <p className="mt-2 text-sm text-foreground/60">
          You can't view this profile or its posts.
        </p>
      </div>
    );
  }

  let allowedUserIds: string[] = [];

  if (!userProfileId) {
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

    allowedUserIds = [
      userId,
      ...follows.map((follow) => follow.followingId),
    ];
  }

  const whereCondition = {
    parentPostId: null,
    userId: userProfileId
      ? userProfileId
      : { in: allowedUserIds },

    // Also exclude reposts whose original author is blocked.
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
    take: 3,
    skip: 0,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="m-auto lg:m-0 lg:border-r border-gray-100 max-w-fit">
      {post.map((post) => (
        <Post key={post.id} post={post} />
      ))}

      <InfiniteFeed userProfileId={userProfileId} />
    </div>
  );
};

export default Feed;
