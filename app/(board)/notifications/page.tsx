"use client"
import { notifications as notification } from "@/assets/dummydata"
import ImageComp from "@/components/ImageComp"
import { socket } from "@/socket";
import { useEffect, useState } from "react";

type NotificationType = {
  id: string;
  senderUsername: string;
  type: "like" | "comment" | "rePost" | "follow";
  link: string;
}

const page = () => {
  const [notifications, setNotification] = useState<NotificationType[]>([]);

  useEffect(()=>{
    socket.on("getNotification", (data:NotificationType)=> {
      setNotification(prev=>[...prev, data])
    })
  }, [])
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="mt-4 flex space-x-6 border-b border-gray-300 pb-2 font-semibold">
        <p className="cursor-pointer">All</p>
        <p className="cursor-pointer">Unread</p>
      </div>
      <div className="">
        {
          notifications.map((n) => (
            <div className=" p-4" key={n.id}>
              <div className="flex items-center space-x-3">
                <ImageComp 
                src={"general/noAvatar.png"} 
                alt="" 
                w={40}
                h={40}
                className="rounded-full" />
                <div>
                  <p className="font-semibold">{n.senderUsername} <span className="text-sm text-gray-400 ml-2">
                    {n.type === "like" 
                      ? "Liked your post" 
                      : n.type === "rePost" 
                      ? "re-posted your post" 
                      : n.type === "comment" 
                      ? "replied to your post" 
                      : "followed you"
                    }
                  </span></p>
                  
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default page