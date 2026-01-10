import { notifications } from "@/assets/dummydata"
import Image from "next/image"

const page = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="mt-4 flex space-x-4 border-b border-gray-300 pb-2">
        <p>All</p>
        <p>Unread</p>
      </div>
      <div className="">
        {
          notifications.map((notification) => (
            <div className=" p-4" key={notification.id}>
              <div className="flex items-center space-x-3">
                <Image src={notification.image} alt={notification.username} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold">{notification.username}</p>
                  <p className="text-sm text-gray-600">{notification.text}</p>
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