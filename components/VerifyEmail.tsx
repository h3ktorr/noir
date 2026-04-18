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
    <div>
     <h1>Verify your email</h1>
        <p>
          We sent a verification code to <strong>{emailAddress}</strong>
        </p>
        <form onSubmit={handleVerify}>
          <div>
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {errors.fields.code && <p>{errors.fields.code.message}</p>}
          </div>
          <button type="submit" disabled={fetchStatus === 'fetching'}>
            Verify
          </button>
        </form>
        <button onClick={() => signIn.emailCode.sendCode()}>Resend code</button>
        <button onClick={() => signIn.reset()}>Start over</button>
    </div>
  )
}

export default VerifyEmail