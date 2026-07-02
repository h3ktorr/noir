import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const userProfileId = searchParams.get("user");
  const page = searchParams.get("cursor");
  const LIMIT = 3; // Number of posts to fetch per page

  const { userId } = await auth();
  if (!userId) return;

  const whereCondition =
    userProfileId !== "undefined"
      ? { parentPostId: null, userId: userProfileId as string }
      : {
          parentPostId: null,
          userId: {
            in: [
              userId,
              ...(
                await prisma.follow.findMany({
                  where: {
                    followerId: userId,
                  },
                  select: {
                    followingId: true,
                  },
                })
              ).map((follow) => follow.followingId),
            ],
          },
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
    },
    take: LIMIT,
    skip: (Number(page) - 1) * LIMIT,
  });

  const totalPosts = await prisma.post.count({ where: whereCondition });

  const hasMore = Number(page) * LIMIT < totalPosts;

  return Response.json({ post, hasMore });
}
