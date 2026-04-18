type Props = {
  emailAddress: string
  code: string
  errors: any
  fetchStatus: string
  signIn: any
  setCode: (code: string) => void
  handleVerify: (e: React.FormEvent<HTMLFormElement>) => void
 }

//TODO: complete the ui design for this component


const VerifyEmail = ({ emailAddress, code, errors, fetchStatus, signIn, setCode, handleVerify }: Props) => {
  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2">
          We sent a verification code to <strong>{emailAddress}</strong>
        </p>
        <form onSubmit={handleVerify} className="flex flex-col mt-6 gap-3 w-full px-8">
          <div>
            <label className="text-sm font-medium" htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 rounded-lg text-background border border-background"
            />
            {errors.fields.code && <p className="text-red-500">{errors.fields.code.message}</p>}
          </div>
          <button type="submit" disabled={fetchStatus === 'fetching'} className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer">
            Verify
          </button>
        </form>
        <div className="mt-6 flex gap-2 w-full px-8">
          <button
            onClick={() => signIn.emailCode.sendCode()}
            className="flex-1 h-10 border border-background px-4 py-2 rounded-lg hover:bg-primary/80 transition"
          >
            Resend code
          </button>
          <button
            onClick={() => signIn.reset()}
            className="flex-1 h-10 border border-background px-4 py-2 rounded-lg hover:bg-primary/80 transition"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail