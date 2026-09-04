import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/"]);

const isClerkWebhook = createRouteMatcher(["/api/webhooks/clerk"]);

export default clerkMiddleware(
  async (auth, req) => {
    // Let Clerk webhook requests pass through without authentication
    if (isClerkWebhook(req)) {
      return;
    }

    const { userId } = await auth();

    if (isProtectedRoute(req)) {
      if (!userId) {
        return (await auth()).redirectToSignIn();
      }

      await auth.protect();
    }
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
