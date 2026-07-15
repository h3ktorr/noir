import Feed from "@/components/Feed";
import Recommendation from "@/components/Recommendation";
import Stories from "@/components/Stories";

export default function Home() {
  return (
    <div className="">
      <Stories />
      <div className="flex">
        <Feed />
        <div className="w-96 max-h-screen overflow-y-auto">
          <Recommendation />
        </div>
      </div>
    </div>
  );
}
