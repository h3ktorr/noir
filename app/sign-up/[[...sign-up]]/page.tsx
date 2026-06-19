'use client'

import { useSignUp } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  // STEP 1: create sign-up
  const signUpWithGoogle = async () => {
    try {
      setIsGoogleLoading(true)

      const { error } = await signUp.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/', // Learn more about session tasks at https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
      })
      if (error) {
        // See https://clerk.com/docs/guides/development/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(error, null, 2))
        return
      }
    } catch (err) {
      console.error(err)
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsEmailLoading(true)
      const { error } = await signUp.password({
        emailAddress,
        password,
        firstName,
        lastName,
        username,
      })

      if (error) {
        console.error(JSON.stringify(error, null, 2))
        return
      }

      // send verification email
      await signUp.verifications.sendEmailCode()
      setVerifying(true)
    } catch (err) {
      console.error(err)
      setIsEmailLoading(false)
    }
  }

  // STEP 2: verify email code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await signUp.verifications.verifyEmailCode({
      code,
    })

    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    }
  }

  // STEP 3: verification screen
  if (verifying) {
    return (
      <div className="fixed z-50 top-0 w-screen h-screen flex justify-center items-center bg-background">
        <div className="bg-foreground w-[50vw] p-8 rounded-2xl text-background flex flex-col items-center">
          <h3 className="text-2xl font-bold">Verify your email</h3>

          <form onSubmit={handleVerify} className="w-full mt-6 flex flex-col gap-3 px-8">
            <label className="text-sm font-medium">Verification Code</label>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-2 rounded-lg text-background border border-background"
              placeholder="Enter code"
            />

            {errors.fields.code && <p>{errors.fields.code.message}</p>}

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="bg-background text-foreground px-4 py-2 rounded-lg mt-4"
            >
              Verify
            </button>
          </form>

          <button
            onClick={() => signUp.verifications.sendEmailCode()}
            className="mt-4 text-sm underline"
          >
            Resend code
          </button>
        </div>
      </div>
    )
  }

  // STEP 4: signup form (your original UI preserved)
  return (
    <div className="fixed z-50 top-0 w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-8">

        <h3 className="text-2xl font-bold">Sign Up for Noir</h3>
        <p className="mt-2">Welcome! Please enter your details.</p>

        <form onSubmit={handleSubmit} className="flex flex-col mt-6 gap-3 w-full px-8">

          <label className="text-sm font-medium">First Name</label>
          <input
            type="text"
            placeholder="Enter your first name"
            className="w-full p-2 rounded-lg text-background border border-background"
            onChange={(e) => setFirstName(e.target.value)}
          />

          <label className="text-sm font-medium">Last Name</label>
          <input
            type="text"
            placeholder="Enter your last name"
            className="w-full p-2 rounded-lg text-background border border-background"
            onChange={(e) => setLastName(e.target.value)} 
          />

          {/* Username (store in metadata later if needed) */}
          <label className="text-sm font-medium">Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            className="w-full p-2 rounded-lg text-background border border-background"
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Email */}
          <label className="text-sm font-medium">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            className="w-full p-2 rounded-lg text-background border border-background"
          />

          {/* Password */}
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded-lg text-background border border-background"
          />

          {errors.fields?.password && (
            <p>{errors.fields.password.message}</p>
          )}

          <button
            type="submit"
            disabled={isEmailLoading || fetchStatus === 'fetching'}
            className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer"
          >
            {isEmailLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* CAPTCHA */}
        <div id="clerk-captcha" className="mt-3" />

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-4 px-8">
          <div className="h-px bg-gray-300 grow"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="h-px bg-gray-300 grow"></div>
        </div>

        {/* Google button (keep as-is, just wire later) */}
        <button
          type="button"
          onClick={signUpWithGoogle}
          disabled={isGoogleLoading}
          className="bg-white text-black w-[80%] max-w-75 flex items-center justify-center gap-2 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
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
            </>
          )}
        </button>

        <p className="text-sm mt-2">
          Already have an account?{" "}
          <a href="/sign-in" className="text-purple-500 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}