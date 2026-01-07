import Image from "next/image"
import Profile1 from "../assets/profile-1.jpg";

const SingleMessage = () => {
  return (
    <div className="w-1/2">
      <div className="">
        <div className="flex">
          <Image 
            src={Profile1}
            alt=""
            className="w-12 h-12 rounded-full mr-4"
          />
          <p className="">Julian Parker</p>
        </div>
        <div className="">
          
        </div>
      </div>
    </div>
  )
}

export default SingleMessage