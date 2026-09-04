import Feed from "@/components/Feed";
import Recommendation from "@/components/Recommendation";
import Stories from "@/components/Stories";

export default function Home() {
  return (
    <div className="md:w-[calc(100vw-180px)]">
      <Stories />
      <div className="flex w-full grow">
        <Feed />
        <div className="flex-1 max-h-screen overflow-y-auto hidden lg:block">
          <Recommendation />
        </div>
      </div>
    </div>
  );
}
