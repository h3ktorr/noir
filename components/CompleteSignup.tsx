type CompleteSignupProps = {
  signUp: any
  fetchStatus: string
  handleMissingRequirements: (e: React.FormEvent<HTMLFormElement>) => void
  signIn: any
}

//TODO: complete the ui design for this component

const CompleteSignup = ({ signUp, fetchStatus, handleMissingRequirements, signIn }: CompleteSignupProps) => {
  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h1 className="text-2xl font-bold">Complete your account</h1>
        <p className="mt-2 text-center">
          Your email has been verified. Please choose a username to finish creating your account.
        </p>
        <form className="flex flex-col mt-6 gap-3 w-full px-8" onSubmit={handleMissingRequirements}>
            <div>
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full p-2 rounded-lg text-background border border-background"
              />
            </div>
          <button type="submit" disabled={fetchStatus === 'fetching'} className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer">
            Create account
          </button>
        </form>
        <button className="mt-3 h-10 border border-background px-4 py-2 rounded-lg hover:bg-primary/80 transition" onClick={() => signIn.reset()}>Start over</button>
      </div>
    </div>
  )
}

export default CompleteSignup