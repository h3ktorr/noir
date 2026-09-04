import { allMessages } from "@/assets/dummydata"
import ImageComp from "./ImageComp"

const AllMessages = () => {
  return (
    <div className="lg:w-1/2 h-full lg:border-r flex flex-col">
      {/* Header */}
      <div className="p-4 lg:border-b ">
        <h1 className="text-2xl font-bold">Messages</h1>
        <input
          type="text"
          className="w-full p-2 border border-foreground rounded mt-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search messages..."
        />
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-4">
        {allMessages.map((message) => (
          <div
            key={message.id}
            className="flex items-center mb-4 p-2 hover:bg-foreground/5 rounded-lg cursor-pointer"
          >
            <ImageComp
              src={message.image}
              alt={message.name}
              w={48}
              h={48}
              className="rounded-full mr-4"
            />
            <div className="flex-1">
              <h2 className="font-semibold">{message.name}</h2>
              <p className="text-sm text-foreground/60 truncate">
                {message.message}
              </p>
            </div>
            <span className="ml-2 text-xs text-foreground/50">
              {message.createdAt}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}

export default AllMessages
