import { auth } from "@clerk/nextjs/server";
import NotificationsClient from "@/components/NotificationsClient";

const Page = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return <NotificationsClient userId={userId} />;
};

export default Page;