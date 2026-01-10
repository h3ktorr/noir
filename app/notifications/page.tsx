import { notifications } from "@/assets/dummydata"
import Image from "next/image"

const page = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="mt-4 flex space-x-6 border-b border-gray-300 pb-2 font-semibold">
        <p className="cursor-pointer">All</p>
        <p className="cursor-pointer">Unread</p>
      </div>
      <div className="">
        {
          notifications.map((notification) => (
            <div className=" p-4" key={notification.id}>
              <div className="flex items-center space-x-3">
                <Image src={notification.image} alt={notification.username} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold">{notification.username} <span className="text-sm text-gray-400 ml-2">{notification.text}</span></p>
                  
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