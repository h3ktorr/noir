"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getIO } from "./lib/socket-server";

export const followUser = async (targetUserId: string) => {
  const { userId } = await auth();

  if (!userId || userId === targetUserId) return;

  const recipient = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  if (!recipient) return;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  // Unfollow
  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    revalidatePath(`/${recipient.username}`);
    revalidatePath("/");

    return { success: true, message: "Unfollowed successfully." };
  }

  // Prevent following users when either person has blocked the other.
  const blockExists = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockerId: userId,
          blockedId: targetUserId,
        },
        {
          blockerId: targetUserId,
          blockedId: userId,
        },
      ],
    },
  });

  if (blockExists) {
    return {
      success: false,
      message: "You cannot follow this user.",
    };
  }

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      img: true,
    },
  });

  if (!sender) return;

  // Create follow relationship and notification together.
  const notification = await prisma.$transaction(async (tx) => {
    await tx.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return tx.notification.create({
      data: {
        senderId: userId,
        recipientId: targetUserId,
        type: "FOLLOW",
        link: `/${sender.username}`,
      },
    });
  });

  // Send notification through Socket.IO.
  getIO()?.to(`user:${targetUserId}`).emit("getNotification", {
    id: notification.id,
    senderUsername: sender.username,
    senderImg: sender.img,
    type: "follow",
    link: notification.link,
    createdAt: notification.createdAt,
    read: notification.read,
  });

  revalidatePath(`/${recipient.username}`);
  revalidatePath("/");

  return { success: true, message: "Followed successfully." };
};

const hasBlockBetweenUsers = async (userId: string, targetUserId: string) => {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockerId: userId,
          blockedId: targetUserId,
        },
        {
          blockerId: targetUserId,
          blockedId: userId,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return !!block;
};

export const likePost = async (postId: number) => {
  const { userId } = await auth();
  if (!userId) return;

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  // Unlike: remove the like and do not create a notification
  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!post) return;

  const isBlocked = await hasBlockBetweenUsers(userId, post.userId);

  if (isBlocked) return;

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      img: true,
    },
  });

  if (!sender) return;

  // Create the like and notification together
  const notification = await prisma.$transaction(async (tx) => {
    await tx.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Do not notify someone when they like their own post
    if (post.userId === userId) return null;

    return tx.notification.create({
      data: {
        senderId: userId,
        recipientId: post.userId,
        type: "LIKE",
        link: `/${post.user.username}/status/${postId}`,
        postId,
      },
    });
  });

  // Send the notification to the recipient's Socket.IO room
  if (notification) {
    getIO()?.to(`user:${post.userId}`).emit("getNotification", {
      id: notification.id,
      senderUsername: sender.username,
      senderImg: sender.img,
      type: "like",
      link: notification.link,
      createdAt: notification.createdAt,
      read: notification.read,
    });
  }
};

export const repostPost = async (postId: number) => {
  const { userId } = await auth();
  if (!userId) return;

  // Check whether this user has already reposted this post
  const existingRepost = await prisma.post.findFirst({
    where: {
      userId,
      rePostId: postId,
    },
  });

  // Undo repost: delete it without sending a notification
  if (existingRepost) {
    await prisma.post.delete({
      where: {
        id: existingRepost.id,
      },
    });

    return;
  }

  // Get the original post owner's information
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!post) return;

  const isBlocked = await hasBlockBetweenUsers(userId, post.userId);

  if (isBlocked) return;

  // Get the person doing the repost
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      img: true,
    },
  });

  if (!sender) return;

  // Create the repost and notification together
  const notification = await prisma.$transaction(async (tx) => {
    await tx.post.create({
      data: {
        userId,
        rePostId: postId,
      },
    });

    // Don't notify someone when they repost their own post
    if (post.userId === userId) return null;

    return tx.notification.create({
      data: {
        senderId: userId,
        recipientId: post.userId,
        type: "REPOST",
        link: `/${post.user.username}/status/${postId}`,
        postId,
      },
    });
  });

  // Send the notification to the original author's Socket.IO room
  if (notification) {
    getIO()?.to(`user:${post.userId}`).emit("getNotification", {
      id: notification.id,
      senderUsername: sender.username,
      senderImg: sender.img,
      type: "rePost",
      link: notification.link,
      createdAt: notification.createdAt,
      read: notification.read,
    });
  }
};

export const savePost = async (postId: number) => {
  const { userId } = await auth();
  if (!userId) return;

  const existingSavedPost = await prisma.savedPosts.findFirst({
    where: {
      userId,
      postId,
    },
  });

  // Unsave: allow users to remove existing saves.
  if (existingSavedPost) {
    await prisma.savedPosts.delete({
      where: {
        id: existingSavedPost.id,
      },
    });

    return;
  }

  // Get the original post owner.
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      userId: true,
    },
  });

  if (!post) return;

  // Prevent saving posts when either user has blocked the other.
  const isBlocked = await hasBlockBetweenUsers(userId, post.userId);

  if (isBlocked) return;

  await prisma.savedPosts.create({
    data: {
      userId,
      postId,
    },
  });
};

export const addComment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData,
) => {
  const { userId } = await auth();
  if (!userId) return { success: false, error: true };

  const desc = formData.get("desc");
  const postId = formData.get("postId");

  const Comment = z.object({
    parentPostId: z.number().int().positive(),
    desc: z.string().min(1).max(255),
  });

  const validatedFields = Comment.safeParse({
    parentPostId: Number(postId),
    desc,
  });

  if (!validatedFields.success) {
    return { success: false, error: true };
  }

  try {
    // Get the original post and its owner's information
    const parentPost = await prisma.post.findUnique({
      where: {
        id: validatedFields.data.parentPostId,
      },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!parentPost) {
      return { success: false, error: true };
    }

    // Prevent commenting when either user has blocked the other.
    const isBlocked = await hasBlockBetweenUsers(userId, parentPost.userId);

    if (isBlocked) {
      return { success: false, error: true };
    }

    // Get the person commenting
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        img: true,
      },
    });

    if (!sender) {
      return { success: false, error: true };
    }

    // Create the comment and notification together
    const notification = await prisma.$transaction(async (tx) => {
      await tx.post.create({
        data: {
          ...validatedFields.data,
          userId,
        },
      });

      // Don't notify someone when they comment on their own post
      if (parentPost.userId === userId) return null;

      return tx.notification.create({
        data: {
          senderId: userId,
          recipientId: parentPost.userId,
          type: "COMMENT",
          link: `/${parentPost.user.username}/status/${validatedFields.data.parentPostId}`,
          postId: validatedFields.data.parentPostId,
        },
      });
    });

    // Send the notification to the original author's Socket.IO room
    if (notification) {
      getIO()?.to(`user:${parentPost.userId}`).emit("getNotification", {
        id: notification.id,
        senderUsername: sender.username,
        senderImg: sender.img,
        type: "comment",
        link: notification.link,
        createdAt: notification.createdAt,
        read: notification.read,
      });
    }

    revalidatePath(
      `/${parentPost.user.username}/status/${validatedFields.data.parentPostId}`,
    );

    return { success: true, error: false };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: true };
  }
};

export const addPost = async (
  _prevState: { success: boolean; error: boolean } | undefined,
  formData: FormData,
) => {
  const { userId } = await auth();
  if (!userId) return { success: false, error: true };

  const desc = formData.get("desc");

  const img = formData.get("img") as string;
  const video = formData.get("video") as string;
  const imgHeight = Number(formData.get("imgHeight"));

  if (!desc && !img && !video) {
    return {
      success: false,
      error: true,
    };
  }

  const Post = z.object({
    desc: z.string().max(280),
  });

  const validatedFields = Post.safeParse({
    desc: desc,
  });

  if (!validatedFields.success) {
    return { success: false, error: true };
  }

  try {
    await prisma.post.create({
      data: {
        ...validatedFields.data,
        userId: userId,
        img,
        imgHeight,
        video,
      },
    });
    revalidatePath(`/`);
    return { success: true, error: false };
  } catch (error) {
    console.log(error);
    return { success: false, error: true };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true, updated: result.count > 0 };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
};

export const markAllNotificationsAsRead = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  revalidatePath("/notifications");

  return { success: true };
};

const reportSchema = z.object({
  targetUserId: z.string().min(1),
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "IMPERSONATION",
    "INAPPROPRIATE",
    "OTHER",
  ]),
  description: z.string().max(1000).optional(),
});

// Check the blocking relationship between the current user and another user.
export async function getBlockStatus(targetUserId: string) {
  const { userId } = await auth();

  if (!userId || userId === targetUserId) {
    return {
      isBlockedByMe: false,
      hasBlockedMe: false,
    };
  }

  const [myBlock, theirBlock] = await Promise.all([
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
      select: { id: true },
    }),
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: targetUserId,
          blockedId: userId,
        },
      },
      select: { id: true },
    }),
  ]);

  return {
    isBlockedByMe: !!myBlock,
    hasBlockedMe: !!theirBlock,
  };
}

// Block another user and remove any existing follow relationships.
export async function blockUser(targetUserId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, message: "You must be logged in." };
  }

  if (userId === targetUserId) {
    return { success: false, message: "You cannot block yourself." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  const existingBlock = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    },
  });

  if (existingBlock) {
    return { success: true, message: "User is already blocked." };
  }

  await prisma.$transaction([
    prisma.block.create({
      data: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetUserId },
          { followerId: targetUserId, followingId: userId },
        ],
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/${targetUser.username}`);

  return { success: true, message: "User blocked successfully." };
}

// Unblock a user.
export async function unblockUser(targetUserId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, message: "You must be logged in." };
  }

  if (userId === targetUserId) {
    return { success: false, message: "Invalid user." };
  }

  await prisma.block.deleteMany({
    where: {
      blockerId: userId,
      blockedId: targetUserId,
    },
  });

  revalidatePath("/");

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  if (targetUser) {
    revalidatePath(`/${targetUser.username}`);
  }

  return { success: true, message: "User unblocked successfully." };
}

// Report another user.
export async function reportUser(
  targetUserId: string,
  reason: string,
  description?: string,
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, message: "You must be logged in." };
  }

  if (userId === targetUserId) {
    return { success: false, message: "You cannot report yourself." };
  }

  const validation = reportSchema.safeParse({
    targetUserId,
    reason,
    description,
  });

  if (!validation.success) {
    return { success: false, message: "Invalid report details." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: userId,
      reportedId: targetUserId,
    },
  });

  if (existingReport) {
    return {
      success: false,
      message: "You have already reported this user.",
    };
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      reportedId: targetUserId,
      reason: validation.data.reason,
      description: validation.data.description?.trim() || null,
    },
  });

  return { success: true, message: "Report submitted successfully." };
}
