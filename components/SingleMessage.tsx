import { Phone, Video, EllipsisVertical, Send } from "lucide-react";
import ImageComp from "./ImageComp";

const SingleMessage = () => {
  return (
    <div className="w-1/2 flex-col h-full hidden lg:flex">
      {/* Messages Header */}
      <div className="flex items-center justify-between p-4 border-b border-foreground">
        <div className="flex items-center">
          <ImageComp 
            src="assets/profile-1.jpg"
            alt=""
            w={48}
            h={48}
            className="w-12 h-12 rounded-full mr-4"
          />
          <p className="font-medium">Julian Parker</p>
        </div>
        <div className="flex gap-4 items-center">
          <Phone size={20} />
          <Video size={20} />
          <EllipsisVertical size={20} />
        </div>
      </div>
      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Incoming */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-foreground/10 p-4 rounded-2xl rounded-tl-none">
            Hey Julian, are you free this afternoon?
          </div>
        </div>
        {/* Outgoing */}
        <div className="flex justify-end">
          <div className="max-w-xs bg-foreground text-background p-4 rounded-2xl rounded-tr-none">
            Yeah, I’m free after 3pm.
          </div>
        </div>
        {/* Incoming */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-foreground/10 p-4 rounded-2xl rounded-tl-none">
            Perfect! Let’s meet then.
          </div>
        </div>
      </div>
      {/* Messages Footer */}
      <div className="p-4 border-t border-foreground bottom-0 flex items-center">
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="w-full p-2 border border-foreground rounded-full bg-background text-foreground focus:outline-none"
        />
        <div className="cursor-pointer ml-4 bg-foreground text-background p-3 rounded-full">
          <Send size={20} />
        </div>
      </div>
    </div>
  )
}

export default SingleMessage