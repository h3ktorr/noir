import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import ably from "@/lib/ably";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: userId,
  });

  return NextResponse.json(tokenRequest);
}
