import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim().replace(/^@/, "");

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        username: {
          contains: query,
        },
        NOT: [
          // Exclude users who have blocked the current viewer.
          {
            blocks: {
              some: {
                blockedId: userId,
              },
            },
          },
          // Exclude users blocked by the current viewer.
          {
            blockedBy: {
              some: {
                blockerId: userId,
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
      },
      orderBy: {
        username: "asc",
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);

    return NextResponse.json(
      { error: "Something went wrong while searching users" },
      { status: 500 },
    );
  }
}
