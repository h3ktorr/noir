"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./lib/prisma";

export const likePost = async (postId: number) => {
  const { userId } = await auth();
  if (!userId) return;

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: userId,
      postId: postId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
  } else {
    await prisma.like.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });
  }
};

export const repostPost = async (postId: number) => {
  const { userId } = await auth();
  if (!userId) return;

  const existingRepost = await prisma.post.findFirst({
    where: {
      userId: userId,
      rePostId: postId,
    },
  });

  if (existingRepost) {
    await prisma.post.delete({
      where: {
        id: existingRepost.id,
      },
    });
  } else {
    await prisma.post.create({
      data: {
        userId: userId,
        rePostId: postId,
      },
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
