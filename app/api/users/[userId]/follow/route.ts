import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const LIMIT = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: username } = await params;

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const cursorParam = searchParams.get("cursor") ?? "0";
    const cursor = Number(cursorParam);

    // Validate the requested list type.
    if (type !== "followers" && type !== "following") {
      return NextResponse.json(
        { error: "Invalid follow list type" },
        { status: 400 },
      );
    }

    // Validate pagination cursor.
    if (!Number.isInteger(cursor) || cursor < 0) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    // Check that the profile exists.
    const profileUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!profileUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileUserId = profileUser.id;

    // Check whether the viewer and profile owner have blocked each other.
    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          {
            blockerId: userId,
            blockedId: profileUserId,
          },
          {
            blockerId: profileUserId,
            blockedId: userId,
          },
        ],
      },
      select: { id: true },
    });

    if (blockExists) {
      return NextResponse.json({
        users: [],
        nextCursor: null,
        hasMore: false,
      });
    }

    // Get users blocked by or blocking the current viewer.
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

    let users;

    if (type === "followers") {
      // People who follow this profile.
      const follows = await prisma.follow.findMany({
        where: {
          followingId: profileUserId,
          followerId: {
            notIn: blockedUserIds,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: cursor,
        take: LIMIT + 1,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              img: true,
            },
          },
        },
      });

      users = follows.map((follow) => follow.follower);
    } else {
      // People this profile follows.
      const follows = await prisma.follow.findMany({
        where: {
          followerId: profileUserId,
          followingId: {
            notIn: blockedUserIds,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: cursor,
        take: LIMIT + 1,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              img: true,
            },
          },
        },
      });

      users = follows.map((follow) => follow.following);
    }

    const hasMore = users.length > LIMIT;

    if (hasMore) {
      users.pop();
    }

    // Check which returned users the current viewer already follows.
    const followedUsers = await prisma.follow.findMany({
      where: {
        followerId: userId,
        followingId: {
          in: users.map((user) => user.id),
        },
      },
      select: {
        followingId: true,
      },
    });

    const followedUserIds = new Set(
      followedUsers.map((follow) => follow.followingId),
    );

    // Attach follow status to every returned user.
    const usersWithFollowStatus = users.map((user) => ({
      ...user,
      isFollowed: followedUserIds.has(user.id),
    }));

    return NextResponse.json({
      users: usersWithFollowStatus,
      nextCursor: hasMore ? cursor + LIMIT : null,
      hasMore,
    });
  } catch (error) {
    console.error("Follow list API error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
