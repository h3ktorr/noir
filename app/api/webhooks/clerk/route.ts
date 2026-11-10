import prisma from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    // const evt = await req.json();

    console.log("===== CLERK WEBHOOK =====");
    console.log("EVENT:", evt.type);
    console.log("USER ID:", evt.data.id);

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data;
    const eventType = evt.type;
    // console.log(
    //   `Received webhook with ID ${id} and event type of ${eventType}`,
    // );
    // console.log("Webhook payload:", evt.data);

    if (eventType === "user.created") {
      const primaryEmail =
        evt.data.email_addresses.find(
          (email: { id: string }) =>
            email.id === evt.data.primary_email_address_id,
        )?.email_address ?? evt.data.email_addresses[0]?.email_address;

      const username = evt.data.username;

      if (!primaryEmail || !username) {
        console.error("Missing required user information:", {
          userId: evt.data.id,
          primaryEmail,
          username,
        });

        return new Response("Missing email or username", {
          status: 400,
        });
      }

      try {
        await prisma.user.upsert({
          where: {
            id: evt.data.id,
          },
          update: {
            email: primaryEmail,
            username,
            displayName:
              `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
          },
          create: {
            id: evt.data.id,
            email: primaryEmail,
            username,
            displayName:
              `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
          },
        });

        console.log("User successfully created in database!");

        return new Response("User created", { status: 200 });
      } catch (error) {
        console.error("Prisma error:", error);

        return new Response("Failed to create user", { status: 500 });
      }
    }

    if (eventType === "user.deleted") {
      try {
        await prisma.user.delete({
          where: {
            id: evt.data.id,
          },
        });
        return new Response("User deleted", { status: 200 });
      } catch (error) {
        console.log(error);
        return new Response("Error: Failed to delete a user", { status: 500 });
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
