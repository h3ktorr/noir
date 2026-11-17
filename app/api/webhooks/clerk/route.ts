import prisma from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

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

  // The Prisma User model requires both email and username.
  // A later user.updated event can create the record once these exist.
  if (!primaryEmail || !username) {
    console.log("Skipping user sync: missing email or username.", {
      userId: user.id,
      hasEmail: Boolean(primaryEmail),
      hasUsername: Boolean(username),
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
      // Do not update displayName here.
      // Noir's displayName is managed separately from Clerk's name.
    },
    create: {
      id: user.id,
      email: primaryEmail,
      username,
      displayName,
    },
  });

  console.log("Clerk user successfully synchronized:", user.id);
}

export async function POST(req: NextRequest) {
  let evt;

  // First verify that the request genuinely came from Clerk.
  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    console.log("===== CLERK WEBHOOK =====");
    console.log("EVENT:", evt.type);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      await syncClerkUser(evt.data);
      return new Response("User synchronization processed", {
        status: 200,
      });
    }

    if (evt.type === "user.deleted") {
      const userId = evt.data.id;

      if (userId) {
        await prisma.user.deleteMany({
          where: { id: userId },
        });

        console.log("Prisma user deleted:", userId);
      }

      return new Response("User deletion processed", {
        status: 200,
      });
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Clerk webhook processing failed:", error);

    return new Response("Webhook processing failed", {
      status: 500,
    });
  }
}
