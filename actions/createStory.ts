"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const storySchema = z.object({
  mediaUrl: z
    .string()
    .min(1)
    .max(1000)
    .refine(
      (value) => value.startsWith("/stories/") && !value.includes(".."),
      "Invalid story media path",
    ),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  visibility: z.enum(["PUBLIC", "FOLLOWERS"]),
});

export async function createStory(
  mediaUrl: string,
  mediaType: "IMAGE" | "VIDEO",
  visibility: "PUBLIC" | "FOLLOWERS",
) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be logged in to create a story.",
    };
  }

  const validation = storySchema.safeParse({
    mediaUrl,
    mediaType,
    visibility,
  });

  if (!validation.success) {
    return {
      success: false,
      message: "Invalid story details.",
    };
  }

  try {
    await prisma.story.create({
      data: {
        mediaUrl: validation.data.mediaUrl,
        mediaType: validation.data.mediaType,
        visibility: validation.data.visibility,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isWelcome: false,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      message: "Story created successfully.",
    };
  } catch (error) {
    console.error("Error creating story:", error);

    return {
      success: false,
      message: "Unable to create your story.",
    };
  }
}
