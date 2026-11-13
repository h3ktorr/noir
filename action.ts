"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getIO } from "./lib/socket-server";

export const followUser = async (targetUserId: string) => {
  const { userId } = await auth();
  if (!userId || userId === targetUserId) return;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  // Unfollow: delete the relationship without notifying
  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return;
  }

  // Get the recipient's information
  const recipient = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      username: true,
    },
  });

  if (!recipient) return;

  // Get the sender's information
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
    },
  });

  if (!sender) return;

  // Create the follow relationship and notification together
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

  // Send the notification through Socket.IO
  if (notification) {
    getIO()?.to(`user:${targetUserId}`).emit("getNotification", {
      id: notification.id,
      senderUsername: sender.username,
      type: "follow",
      link: notification.link,
      createdAt: notification.createdAt,
      read: notification.read,
    });
  }
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

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
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

  // Get the person doing the repost
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
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
      userId: userId,
      postId: postId,
    },
  });

  if (existingSavedPost) {
    await prisma.savedPosts.delete({
      where: {
        id: existingSavedPost.id,
      },
    });
  } else {
    await prisma.savedPosts.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });
  }
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

    // Get the person commenting
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
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
