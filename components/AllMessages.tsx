import { allMessages } from "@/assets/dummydata"
import Image from "next/image"

const AllMessages = () => {
  return (
    <div className="w-1/2 border-r p-4">
      <div className="p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold ">Messages</h1>
        <input type="text" className="w-full p-2 border border-foreground rounded mt-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search messages..." />
      </div>
      <div className="border-t mt-4 pt-4">
        {/* Messages will be listed here */}
        {allMessages.map((message) => (
          <div key={message.id} className="flex items-center mb-4 p-2 hover:border border-foreground rounded-lg cursor-pointer">
            <Image src={message.image} alt={message.name} className="w-12 h-12 rounded-full mr-4" />
            <div>
              <h2 className="font-semibold">{message.name}</h2>
              <p className="text-sm text-gray-500 truncate w-40">{message.message}</p>
            </div>
            <span className="ml-auto text-xs text-gray-500">{message.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllMessages
