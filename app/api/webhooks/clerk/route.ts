import prisma from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ClerkUserPayload = {
  id: string;
  email_addresses: {
    id: string;
    email_address: string;
  }[];
  primary_email_address_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

async function syncClerkUser(user: ClerkUserPayload) {
  const primaryEmail =
    user.email_addresses.find(
      (email) => email.id === user.primary_email_address_id,
    )?.email_address ?? user.email_addresses[0]?.email_address;

  const username = user.username?.trim().toLowerCase();

  console.log("Preparing Prisma user synchronization:", {
    userId: user.id,
    hasEmail: Boolean(primaryEmail),
    hasUsername: Boolean(username),
  });

  if (!primaryEmail || !username) {
    console.warn("User synchronization skipped:", {
      userId: user.id,
      reason: !primaryEmail ? "Missing email" : "Missing username",
    });

    return;
  }

  const displayName =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || null;

  await prisma.user.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: primaryEmail,
      username,
    },
    create: {
      id: user.id,
      email: primaryEmail,
      username,
      displayName,
    },
  });

  console.log("Prisma user successfully synchronized:", user.id);
}

// Permanently delete a user and all dependent records.
async function deleteClerkUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Find all posts created by this user.
    const originalPosts = await tx.post.findMany({
      where: { userId },
      select: {
        id: true,
        parentPostId: true,
        rePostId: true,
      },
    });

    const posts = new Map<
      number,
      {
        id: number;
        parentPostId: number | null;
        rePostId: number | null;
      }
    >();

    let frontier = originalPosts.map((post) => post.id);

    for (const post of originalPosts) {
      posts.set(post.id, post);
    }

    // 2. Recursively find comments and reposts
    //    belonging to other users that depend on these posts.
    while (frontier.length > 0) {
      const children = await tx.post.findMany({
        where: {
          OR: [
            { parentPostId: { in: frontier } },
            { rePostId: { in: frontier } },
          ],
        },
        select: {
          id: true,
          parentPostId: true,
          rePostId: true,
        },
      });

      const nextFrontier: number[] = [];

      for (const child of children) {
        if (posts.has(child.id)) continue;

        posts.set(child.id, child);
        nextFrontier.push(child.id);
      }

      frontier = nextFrontier;
    }

    const postIds = [...posts.keys()];

    console.log("Posts scheduled for deletion:", postIds.length);

    // 3. Delete notifications sent or received by the user,
    //    or attached to posts being deleted.
    await tx.notification.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
          ...(postIds.length > 0 ? [{ postId: { in: postIds } }] : []),
        ],
      },
    });

    // 4. Delete likes involving the user or affected posts.
    await tx.like.deleteMany({
      where: {
        OR: [
          { userId },
          ...(postIds.length > 0 ? [{ postId: { in: postIds } }] : []),
        ],
      },
    });

    // 5. Delete saved posts involving the user or affected posts.
    await tx.savedPosts.deleteMany({
      where: {
        OR: [
          { userId },
          ...(postIds.length > 0 ? [{ postId: { in: postIds } }] : []),
        ],
      },
    });

    // 6. Delete follows involving the user.
    await tx.follow.deleteMany({
      where: {
        OR: [{ followerId: userId }, { followingId: userId }],
      },
    });

    // 7. Delete blocks involving the user.
    await tx.block.deleteMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    // 8. Delete reports involving the user.
    await tx.report.deleteMany({
      where: {
        OR: [{ reporterId: userId }, { reportedId: userId }],
      },
    });

    // 9. Delete posts from leaves upward to respect
    //    the Post self-relations.
    const childCounts = new Map<number, number>();
    const parentsByChild = new Map<number, number[]>();

    for (const id of postIds) {
      childCounts.set(id, 0);
    }

    for (const post of posts.values()) {
      const parents = [
        ...new Set(
          [post.parentPostId, post.rePostId].filter(
            (id): id is number => id !== null && posts.has(id),
          ),
        ),
      ];

      parentsByChild.set(post.id, parents);

      for (const parentId of parents) {
        childCounts.set(parentId, (childCounts.get(parentId) ?? 0) + 1);
      }
    }

    let leaves = postIds.filter((id) => childCounts.get(id) === 0);

    let deletedCount = 0;

    while (leaves.length > 0) {
      await tx.post.deleteMany({
        where: {
          id: { in: leaves },
        },
      });

      deletedCount += leaves.length;

      const nextLeaves: number[] = [];

      for (const childId of leaves) {
        for (const parentId of parentsByChild.get(childId) ?? []) {
          const remaining = (childCounts.get(parentId) ?? 0) - 1;

          childCounts.set(parentId, remaining);

          if (remaining === 0) {
            nextLeaves.push(parentId);
          }
        }
      }

      leaves = nextLeaves;
    }

    // Abort and roll back if circular relationships exist.
    if (deletedCount !== posts.size) {
      throw new Error(
        "Unable to delete posts: circular post relationships detected.",
      );
    }

    // 10. Finally, delete the user.
    await tx.user.deleteMany({
      where: { id: userId },
    });

    console.log("Deleted associated posts:", deletedCount);
  });
}

export async function POST(req: NextRequest) {
  let evt;

  // 1. Verify the webhook signature.
  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  // 2. Process the verified event.
  try {
    console.log("========== CLERK WEBHOOK ==========");
    console.log("EVENT:", evt.type);

    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        await syncClerkUser(evt.data as ClerkUserPayload);

        return NextResponse.json({
          success: true,
          message: `${evt.type} processed`,
        });
      }

      case "user.deleted": {
        const userId = evt.data.id;

        if (!userId) {
          console.warn("User deletion event has no user ID.");

          return NextResponse.json({
            success: true,
            message: "No user ID supplied",
          });
        }

        await deleteClerkUser(userId);

        console.log("Prisma user and all associated records deleted:", userId);

        return NextResponse.json({
          success: true,
          message: "User and associated records deleted",
        });
      }

      default: {
        console.log("Ignoring unsupported Clerk event:", evt.type);

        return NextResponse.json({
          success: true,
          message: "Event received but not processed",
        });
      }
    }
  } catch (error) {
    console.error("Clerk webhook processing failed:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}
