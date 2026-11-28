"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function addGroupMembers(
  conversationId: string,
  memberIds: string[],
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (
    typeof conversationId !== "string" ||
    !conversationId.trim() ||
    !Array.isArray(memberIds)
  ) {
    return { success: false, error: "Invalid request." };
  }

  const uniqueMemberIds = [
    ...new Set(
      memberIds
        .filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
        .map((id) => id.trim()),
    ),
  ].filter((id) => id !== userId);

  if (uniqueMemberIds.length === 0) {
    return {
      success: false,
      error: "Select at least one person to add.",
    };
  }

  if (uniqueMemberIds.length > 100) {
    return {
      success: false,
      error: "You can add at most 100 people at a time.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Only an active group admin can add members.
      const conversation = await tx.conversation.findFirst({
        where: {
          id: conversationId,
          isGroup: true,
          participants: {
            some: {
              userId,
              role: "ADMIN",
              archivedAt: null,
            },
          },
        },
        select: {
          id: true,
          participants: {
            select: {
              userId: true,
              archivedAt: true,
            },
          },
        },
      });

      if (!conversation) {
        return {
          success: false as const,
          error: "Group not found or you don't have permission to add members.",
        };
      }

      // Separate active participants from archived participants.
      const activeParticipants = conversation.participants.filter(
        (participant) => participant.archivedAt === null,
      );

      const archivedParticipants = conversation.participants.filter(
        (participant) => participant.archivedAt !== null,
      );

      const activeMemberIds = new Set(
        activeParticipants.map((participant) => participant.userId),
      );

      const archivedMemberIds = new Set(
        archivedParticipants.map((participant) => participant.userId),
      );

      // Remove users who are already active members.
      const candidateIds = uniqueMemberIds.filter(
        (id) => !activeMemberIds.has(id),
      );

      if (candidateIds.length === 0) {
        return {
          success: false as const,
          error: "All selected users are already members of this group.",
        };
      }

      // Check the group limit using active participants only.
      if (activeParticipants.length + candidateIds.length > 100) {
        return {
          success: false as const,
          error: "A group can have at most 100 members.",
        };
      }

      // Verify that every selected user exists.
      const users = await tx.user.findMany({
        where: {
          id: { in: candidateIds },
        },
        select: {
          id: true,
        },
      });

      if (users.length !== candidateIds.length) {
        return {
          success: false as const,
          error: "One or more selected users could not be found.",
        };
      }

      // Check blocks between existing active members and selected users.
      const block = await tx.block.findFirst({
        where: {
          OR: [
            {
              blockerId: { in: [...activeMemberIds] },
              blockedId: { in: candidateIds },
            },
            {
              blockerId: { in: candidateIds },
              blockedId: { in: [...activeMemberIds] },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (block) {
        return {
          success: false as const,
          error: "One or more users cannot be added because of a block.",
        };
      }

      // Separate previously archived users from genuinely new users.
      const archivedIds = candidateIds.filter((id) =>
        archivedMemberIds.has(id),
      );

      const newIds = candidateIds.filter((id) => !archivedMemberIds.has(id));

      // Reactivate previously archived participants.
      if (archivedIds.length > 0) {
        await tx.conversationParticipant.updateMany({
          where: {
            conversationId,
            userId: { in: archivedIds },
            archivedAt: { not: null },
          },
          data: {
            archivedAt: null,
            joinedAt: new Date(),
            lastReadAt: null,
            role: "MEMBER",
          },
        });
      }

      // Create participant records for genuinely new users.
      if (newIds.length > 0) {
        await tx.conversationParticipant.createMany({
          data: newIds.map((memberId) => ({
            conversationId,
            userId: memberId,
            role: "MEMBER",
          })),
          skipDuplicates: true,
        });
      }

      return {
        success: true as const,
        addedCount: candidateIds.length,
        addedUserIds: candidateIds,
      };
    });

    if (!result.success) {
      return result;
    }

    // Emit realtime events only after the database transaction commits.
    const io = getIO();

    if (io && result.addedCount > 0) {
      // Update existing members who are currently viewing this group.
      io.to(`conversation:${conversationId}`).emit("group:members-updated", {
        conversationId,
      });

      // Refresh the inbox for every newly added or reactivated member.
      for (const memberId of result.addedUserIds) {
        io.to(`user:${memberId}`).emit("inbox:update");
      }
    }

    return {
      success: true,
      addedCount: result.addedCount,
    };
  } catch (error) {
    console.error("Add group members error:", error);

    return {
      success: false,
      error: "Something went wrong while adding members.",
    };
  }
}
