'use client'

import { AppContext } from "@/context/AppContext";
import { useContext, useEffect, useRef, useState } from "react";
import { X, Image as LumineImage, Smile, CalendarClock, MapPin  } from "lucide-react";
import ImageComp from "./ImageComp";
import { createPostAction } from "@/actions";

const CreatePost = () => {
  const { isCreatePostOpen, closeCreatePost} = useContext(AppContext)!;
  const createPostRef = useRef<HTMLDivElement>(null);
  const [media, setMedia] = useState<File | null>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };

  const handleCreatePostClose = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
   if (e.target === createPostRef.current) {
     closeCreatePost();
   }
  };

  useEffect(() => {
    if (isCreatePostOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isCreatePostOpen]);

  return (
    <div ref={createPostRef} onClick={handleCreatePostClose} className={isCreatePostOpen ? "fixed z-50 top-0 self-end w-screen bg-black/50 opacity-100 overflow-auto translate-x-0 transition-all duration-500 ease-in h-screen flex justify-center items-center" : "fixed z-50 top-0 self-end w-screen bg-black/50 opacity-0 overflow-hidden -translate-x-full transition-all duration-500 ease-in h-screen flex justify-center items-center"}>
      <div className="bg-foreground m-auto w-[70vw] p-4 px-12 h-2/3 overflow-scroll rounded-2xl flex flex-col text-background">
        <div className="p-4 flex justify-between">
          <h3 className="text-xl font-bold">Create Post</h3>
          <X size={20} onClick={closeCreatePost}/>
        </div>
        <form action={createPostAction} className="flex p-4  gap-6">
          <ImageComp src="assets/profile-3.jpg" alt="profile" w={48} h={48} className="w-12 h-12 rounded-full mb-4"/>
          <div className="w-full flex flex-col">
            <textarea rows={5} name="desc" className="w-full p-2 rounded-lg text-background border border-background resize-none" placeholder="What's on your mind?"></textarea>
            <div className="mt-4 flex justify-between items-center">
              <div className="mt-4 flex gap-2">
                  <label htmlFor="media-input">
                    <LumineImage size={24} className="inline mr-4 cursor-pointer hover:text-primary transition"/>
                  </label>
                  <input id="media-input" type="file" name="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden"/>
                <Smile size={24} className="inline mr-4 cursor-pointer hover:text-primary transition"/>
                <CalendarClock size={24} className="inline mr-4 cursor-pointer hover:text-primary transition"/>
                <MapPin size={24} className="inline mr-4 cursor-pointer hover:text-primary transition"/>
              </div>
              <button type="submit" className="mt-4 ml-auto bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition">Post</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
