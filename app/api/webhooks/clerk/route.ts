import prisma from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

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
      console.log("EMAILS:", evt.data.email_addresses);
      try {
        await prisma.user.create({
          data: {
            id: evt.data.id,
            email: evt.data.email_addresses[0].email_address,
            username: evt.data.username!,
            displayName: evt.data.first_name + " " + evt.data.last_name,
          },
        });
        return new Response("User created", { status: 200 });
      } catch (error) {
        console.log(error);
        return new Response("Error: Failed to create a user", { status: 500 });
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
