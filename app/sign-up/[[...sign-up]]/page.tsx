export default function Page() {
  //TODO: Implement Clerk
  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-8">
        <h3 className="text-2xl font-bold">Sign Up for Noir</h3>
        <p className="mt-2">Welcome! Please enter your details.</p>
        <form action="/api/auth/sign-up" method="POST" className="flex flex-col mt-6 gap-3 w-full px-8">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            className="w-full p-2 rounded-lg text-background border border-background"
          />
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            className="w-full p-2 rounded-lg text-background border border-background"
          />
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            className="w-full p-2 rounded-lg text-background border border-background"
          />
          <button
            type="submit"
            className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer"
          >
            Sign Up
          </button>
        </form>
        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-4 px-8">
          <div className="h-px bg-gray-300 grow"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="h-px bg-gray-300 grow"></div>
        </div>

        {/* Google button */}
        <button
          type="button"
          className="bg-white text-black w-[80%] max-w-75 flex items-center justify-center gap-2 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          <svg viewBox="0 0 24 24" width={20} height={20}>
            <path
              d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z"
              fill="#EA4335"
            />
            <path
              d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z"
              fill="#FBBC05"
            />
            <path
              d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z"
              fill="#34A853"
            />
            <path
              d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z"
              fill="#4285F4"
            />
          </svg>
          Continue with Google
        </button>
        <p className="text-sm mt-2">Already have an account? <a href="/sign-in" className="text-purple-500 hover:underline ">Sign in</a></p>
      </div>
    </div>
  )
}

