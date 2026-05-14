type CompleteSignupProps = {
  signUp: any
  fetchStatus: string
  handleMissingRequirements: (e: React.FormEvent<HTMLFormElement>) => void
  signIn: any
}

const CompleteSignup = ({ signUp, fetchStatus, handleMissingRequirements, signIn }: CompleteSignupProps) => {
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('signUp status BEFORE update:', signUp.status)
    console.log('signUp id:', signUp.id)
    console.log('missing fields:', signUp.missingFields)

    const formData = new FormData(e.currentTarget)

    const username = formData.get("username") as string
    const firstName = formData.get("first_name") as string
    const lastName = formData.get("last_name") as string

    console.log(username, firstName, lastName)
    if (!signUp || !signUp.id) {
      console.error('SignUp not initialized properly')
      return
    }
    if (!username || !firstName || !lastName) {
      console.error('All fields are required')
      return
    }

    await signUp.update({
      username,
      firstName,
      lastName,
    })

    handleMissingRequirements(e)
  }

  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h1 className="text-2xl font-bold">Complete your account</h1>
        <p className="mt-2 text-center">
          Your email has been verified. Please choose a username to finish creating your account.
        </p>
        <form className="flex flex-col mt-6 gap-3 w-full px-8" onSubmit={onSubmit}>
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
            <div>
              <label htmlFor="first_name" className="text-sm font-medium">First Name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="w-full p-2 rounded-lg text-background border border-background"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="text-sm font-medium">Last Name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="w-full p-2 rounded-lg text-background border border-background"
              />
            </div>
          <button 
            type="submit" 
            disabled={fetchStatus === 'fetching'} 
            className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer">
            Create account
          </button>
        </form>
        <button className="mt-3 h-10 border border-background px-4 py-2 rounded-lg hover:bg-primary/80 transition" onClick={() => signIn.reset()}>Start over</button>
      </div>
    </div>
  )
}

export default CompleteSignup