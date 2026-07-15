

const Recommendation = () => {
  return (
    <div className="w-11/12 m-auto mt-4 p-4 border border-gray-100 rounded-lg max-h-screen">
      <div className="">
        <h2 className="text-lg font-bold">Recommendation</h2>
        <p className="text-gray-500">Find people you might like</p>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300"></div>
          <div className="">
            <h3 className="font-bold">John Doe</h3>
            <p className="text-gray-500">Software Engineer</p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ml-auto">
            Follow
          </button>
        </div> 
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300"></div>
          <div className="">
            <h3 className="font-bold">John Doe</h3>
            <p className="text-gray-500">Software Engineer</p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ml-auto">
            Follow
          </button>
        </div> 
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-300"></div>
          <div className="">
            <h3 className="font-bold">John Doe</h3>
            <p className="text-gray-500">Software Engineer</p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ml-auto">
            Follow
          </button>
        </div> 
      </div>
    </div>
  )
}

export default Recommendation