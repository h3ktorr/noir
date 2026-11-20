import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that must remain accessible without authentication.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    // Allow authentication pages, OAuth callback and Clerk webhooks.
    if (isPublicRoute(req)) {
      return;
    }

    // Require authentication for every other matched route.
    await auth.protect();
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
