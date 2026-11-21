
import { getStories } from "@/actions/getStories";
import StoriesClient from "./StoriesClient";

export default async function Stories() {
  const users = await getStories();

  return <StoriesClient users={users} />;
}
