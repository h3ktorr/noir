import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react"

const PostInteractions = ({count}: {
  count?: {likes?: number; rePosts?: number; comments?: number};
}) => {
  const likes = count?.likes ?? 0;
  const rePosts = count?.rePosts ?? 0;
  const comments = count?.comments ?? 0;

  return (
    <div className="flex pt-8 gap-16 justify-end mr-10">
       <div className="flex gap-1 group cursor-pointer">
        <Heart size={27} className="text-foreground group-hover:text-red-500" />
        <span className="text-foreground/70 ml-2 self-center">{likes}</span>
       </div>
       <div className="flex gap-1 group cursor-pointer">
        <Repeat2 size={27} className="text-foreground group-hover:text-green-500" />
        <span className="text-foreground/70 ml-2 self-center">{rePosts}</span>
       </div>
       <div className="flex gap-1 group cursor-pointer">
        <MessageCircle size={24} className="text-foreground group-hover:text-blue-500" />
        <span className="text-foreground/70 ml-2 self-center">{comments}</span>
       </div>
       <Bookmark size={27} className="text-foreground group-hover:text-blue-500" />
     </div>
  )
}

export default PostInteractions