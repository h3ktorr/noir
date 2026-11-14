"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers, and underscores"),
  bio: z.string().trim().max(160, "Bio cannot exceed 160 characters"),
  location: z.string().trim().max(60),
  job: z.string().trim().max(60),
  img: z.string().max(1000).optional(),
  cover: z.string().max(1000).optional(),
});

export async function updateProfile(input: unknown) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "You must be signed in." };
    }

    const result = profileSchema.safeParse(input);

    if (!result.success) {
      return {
        success: false,
        error:
          result.error.issues[0]?.message || "Invalid profile information.",
      };
    }

    const data = result.data;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!currentUser) {
      return { success: false, error: "Profile not found." };
    }

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existingUsername) {
      return { success: false, error: "That username is already taken." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
        location: data.location,
        job: data.job,
        ...(data.img !== undefined && { img: data.img }),
        ...(data.cover !== undefined && { cover: data.cover }),
      },
    });

    revalidatePath(`/${currentUser.username}`);
    revalidatePath(`/${data.username}`);

    return {
      success: true,
      username: data.username,
    };
  } catch (error) {
    console.error("Profile update error:", error);

    return {
      success: false,
      error: "Something went wrong while updating your profile.",
    };
  }
}
