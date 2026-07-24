"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const followUser = async (targetUserId: string) => {
  const { userId } = await auth();
  if (!userId) return;

  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });
  }
};

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

export const addComment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData,
) => {
  const { userId } = await auth();
  if (!userId) return { success: false, error: true };

  const desc = formData.get("desc");
  const postId = formData.get("postId");
  const username = formData.get("username");

  const Comment = z.object({
    parentPostId: z.number(),
    desc: z.string().min(1).max(280),
  });

  const validatedFields = Comment.safeParse({
    parentPostId: Number(postId),
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
      },
    });
    revalidatePath(`/${username}/status/${postId}`);
    return { success: true, error: false };
  } catch (error) {
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
