type CompleteSignupProps = {
  signUp: any
  fetchStatus: string
  handleMissingRequirements: (e: React.FormEvent<HTMLFormElement>) => void
  signIn: any
}

//TODO: complete the ui design for this component

const CompleteSignup = ({ signUp, fetchStatus, handleMissingRequirements, signIn }: CompleteSignupProps) => {
  return (
    <div>
     <h1>Complete your account</h1>
        <p>Your email has been verified. Please complete the following to create your account.</p>
        <form onSubmit={handleMissingRequirements}>
          {signUp.missingFields.includes('legal_accepted') && (
            <div>
              <label>
                <input type="checkbox" required />I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          )}
          <button type="submit" disabled={fetchStatus === 'fetching'}>
            Create account
          </button>
        </form>

        <button onClick={() => signIn.reset()}>Start over</button>
    </div>
  )
}

export default CompleteSignup