'use client'

import { AppContext } from "@/context/AppContext";
import { useContext, useEffect, useRef, useState, useActionState } from "react";
import { X, Image as LumineImage, Smile, CalendarClock, MapPin  } from "lucide-react";
import ImageComp from "./ImageComp";
import { createPostAction } from "@/actions/createPost";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

const CreatePost = () => {
  const { isCreatePostOpen, closeCreatePost} = useContext(AppContext)!;
  const createPostRef = useRef<HTMLDivElement>(null);
  const [media, setMedia] = useState<File | null>(null);
  
  const handleCreatePostClose = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
   if (e.target === createPostRef.current) {
     closeCreatePost();
   }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };  

  const previewUrl = media ? URL.createObjectURL(media) : null;

  const { user } = useUser();

  const [state, formAction, isPending] = useActionState(createPostAction, {success: false, error: false})

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

  useEffect(() => {
    if (state?.success) {
      closeCreatePost();
      setMedia(null);
    }
  }, [state, closeCreatePost]);

  return (
    <div ref={createPostRef} onClick={handleCreatePostClose} className={isCreatePostOpen ? "fixed z-50 top-0 self-end w-screen bg-black/50 opacity-100 overflow-auto translate-x-0 transition-all duration-500 ease-in h-screen flex justify-center items-center" : "fixed z-50 top-0 self-end w-screen bg-black/50 opacity-0 overflow-hidden -translate-x-full transition-all duration-500 ease-in h-screen flex justify-center items-center"}>
      <div className="bg-foreground m-auto w-[70vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col text-background">
        <div className="p-4 flex justify-between">
          <h3 className="text-xl font-bold">Create Post</h3>
          <X size={20} onClick={closeCreatePost}/>
        </div>
        <form action={formAction} className="sm:flex p-4 sm:gap-6">
          <ImageComp src={user?.imageUrl || "assets/profile-3.jpg"} alt="profile" w={48} h={48} className="w-12 h-12 rounded-full mb-4 hidden sm:block"/>
          <div className="w-full flex flex-col">
            <textarea rows={5} name="desc" className="w-full p-2 rounded-lg text-background border border-background resize-none" placeholder="What's on your mind?"></textarea>
            {
              media?.type.includes("image") && previewUrl && <div className="relative rounded overflow-hidden mt-4 w-40 h-40">
                <Image 
                  src={previewUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
                <X size={18} onClick={() => setMedia(null)} className="absolute top-1 right-1 cursor-pointer bg-black/50 rounded-full p-1 text-white"/>
              </div>
            }
            {
              media?.type.includes("video") && previewUrl && <div className="w-40 h-fit relative rounded overflow-hidden mt-4">
                <video src={previewUrl} controls className=" object-cover"/>
                <X size={18} onClick={() => setMedia(null)} className="absolute top-1 right-1 cursor-pointer bg-black/50 rounded-full p-1 text-white"/>
              </div>
            }
            <div className="mt-2 flex justify-between items-center">
              <div className="mt-4 flex gap-1 sm:gap-2">
                  <label htmlFor="media-input">
                    <LumineImage className="inline mr-4 cursor-pointer hover:text-primary transition w-5 sm:w-6"/>
                  </label>
                  <input id="media-input" type="file" name="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden"/>
                <Smile className="inline mr-4 cursor-pointer hover:text-primary transition w-5 sm:w-6"/>
                <CalendarClock className="inline mr-4 cursor-pointer hover:text-primary transition w-5 sm:w-6"/>
                <MapPin className="inline mr-4 cursor-pointer hover:text-primary transition w-5 sm:w-6"/>
              </div>
              <button type="submit" className="mt-4 ml-auto bg-background text-foreground px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-primary/80 transition disabled:cursor-not-allowed" disabled={isPending}>{ isPending ? "Posting" : "Post"}</button>
              { (state!==undefined && state.error) && <span className="text-red-300 p-4">Something went wrong</span>}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
