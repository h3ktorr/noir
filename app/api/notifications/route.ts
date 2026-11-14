import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    if (!cursor) {
      return NextResponse.json(
        { error: "Missing pagination cursor" },
        { status: 400 },
      );
    }

    // Make sure the cursor belongs to this user
    const cursorNotification = await prisma.notification.findFirst({
      where: {
        id: cursor,
        recipientId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!cursorNotification) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const records = await prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      include: {
        sender: {
          select: {
            username: true,
            img: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: {
        id: cursor,
      },
      skip: 1,
      take: PAGE_SIZE + 1,
    });

    const hasMore = records.length > PAGE_SIZE;
    const pageRecords = records.slice(0, PAGE_SIZE);

    const notifications = pageRecords.map((notification) => ({
      id: notification.id,
      senderUsername: notification.sender.username,
      senderImg: notification.sender.img,
      type:
        notification.type === "LIKE"
          ? "like"
          : notification.type === "COMMENT"
            ? "comment"
            : notification.type === "REPOST"
              ? "rePost"
              : "follow",
      link: notification.link ?? "/",
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications,
      hasMore,
      nextCursor:
        pageRecords.length > 0 ? pageRecords[pageRecords.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error fetching more notifications:", error);

    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
