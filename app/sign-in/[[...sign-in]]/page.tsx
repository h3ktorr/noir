'use client'

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/shared/types'
import { useRouter } from 'next/navigation';
import { useState } from "react";
import type { ClerkAPIError } from '@clerk/types'
import VerifyEmail from '@/components/VerifyEmail';
import CompleteSignup from '@/components/CompleteSignup';

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const { redirectToSignIn } = useClerk()

  const [emailAddress, setEmailAddress] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showMissingRequirements, setShowMissingRequirements] = useState(false)

  //TODO: REFACTOR THIS COMPONENT
  const signInWith = async (strategy: OAuthStrategy) => {
    const { error } = await signIn.sso({
      strategy,
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/sign-in/tasks', // Learn more about session tasks at https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
    })
    if (error) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }


  // Helper to finalize sign-in and navigate
  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          // Handle pending session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          console.log(session?.currentTask)
          return
        }

        const url = decorateUrl('/')
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      },
    })
  }

  // Helper to finalize sign-up and navigate
  const finalizeSignUp = async () => {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          // Handle pending session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          console.log(session?.currentTask)
          return
        }

        const url = decorateUrl('/')
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      },
    })
  }

  // Step 1: Start sign-in with signUpIfMissing and send email code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Create sign-in for the signUpIfMissing flow.
    // The flow will proceed to verification regardless of whether an account exists or not.
    const { error: createError } = await signIn.create({
      identifier: emailAddress,
      signUpIfMissing: true,
    })
    if (createError) {
      console.error(JSON.stringify(createError, null, 2))
      return
    }

    // Start the verification step
    if (!createError) {
      const { error: sendError } = await signIn.emailCode.sendCode()
      if (sendError) {
        console.error(JSON.stringify(sendError, null, 2))
        return
      }

      setVerifying(true)
    }
  }

  // Step 2: Verification step
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await signIn.emailCode.verifyCode({ code })

    // When the user doesn't exist, verifyCode returns an error with
    // the code 'sign_up_if_missing_transfer'. Check for this error
    // to determine if we need to transfer to sign-up.
    if (error) {
      const clerkError = error as { errors?: ClerkAPIError[] }

      const transferError = clerkError.errors?.find(
        (e) => e.code === 'sign_up_if_missing_transfer'
      )

      if (transferError) {
        await handleTransfer()
        return
      }

      // Some other error occurred
      console.error(JSON.stringify(error, null, 2))
      return
    }

    // The user exists and verification succeeded
    if (signIn.status === 'complete') {
      await finalizeSignIn()
    } else if (signIn.status === 'needs_second_factor') {
      // Handle MFA if required
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // Handle client trust if required
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn.status)
    }
  }

  // Step 3: Transfer to sign-up
  const handleTransfer = async () => {
    // Create sign-up using transfer.
    // This moves the verified identification from the sign-in to a new sign-up.
    const { error } = await signUp.create({ transfer: true })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signUp.status === 'complete') {
      // No additional requirements - sign-up is complete
      await finalizeSignUp()
    } else if (signUp.status === 'missing_requirements') {
      // Additional fields are required to complete sign-up.
      // Common missing fields include legal_accepted, first_name, last_name, etc.
      // Show a form to collect the missing fields.
      setShowMissingRequirements(true)
    } else {
      console.error('Unexpected sign-up status:', signUp.status)
    }
  }

  // Step 4: Submit missing requirements to complete sign-up
  const handleMissingRequirements = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('signUp status BEFORE update:', signUp.status)
  console.log('signUp id:', signUp.id)
  console.log('missing fields:', signUp.missingFields)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const username = formData.get('username') as string
    console.log('Collected username:', username)
    if (!signUp || !signUp.id) {
      console.error('SignUp not initialized properly')
      return
    }
    if (!username) {
      console.error('Username is required')
      return
    }
    const { error } = await signUp.update({
      firstName: formData.get('first_name') as string,
      lastName: formData.get('last_name') as string,
      unsafeMetadata: {
        username,
      }
    })
    if (error) {
      console.error(error)
      return
    }

    console.log('signUp status AFTER update:', signUp.status)

    if (signUp.status === 'complete') {
      await finalizeSignUp()
    } else if (signUp.status === 'missing_requirements') {
      // Still missing other fields
      console.error('Additional fields still required:', signUp.missingFields)
    } else {
      console.error('Unexpected sign-up status:', signUp.status)
    }
  }

  // Step 4 UI: Show missing requirements form
  if (showMissingRequirements) {
    return (
      <>
        <CompleteSignup
          signUp={signUp}
          fetchStatus={fetchStatus}
          handleMissingRequirements={handleMissingRequirements}
          signIn={signIn}
        />
      </>
    )
  }

  // Step 2 UI: Show verification code form
  if (verifying) {
    return (
      <VerifyEmail
          emailAddress={emailAddress}
          code={code}
          errors={errors}
          fetchStatus={fetchStatus}
          signIn={signIn}
          setCode={setCode}
          handleVerify={handleVerify}
      />
    )
  }

  console.log(errors)

  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h3 className="text-2xl font-bold">Sign In to Noir</h3>
        <p className="mt-2">Welcome back! Please enter your details.</p>
        <form onSubmit={handleSubmit} className="flex flex-col mt-6 gap-3 w-full px-8">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Enter your email address"
            className="w-full p-2 rounded-lg text-background border border-background"
          />
          {errors.fields.identifier && <p>{errors.fields.identifier.message}</p>}
          <button
            type="submit"
            className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer"
          >
            Proceed
          </button>
        </form>
      {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default. */}
      <div id="clerk-captcha" className='mt-3' />
        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-6 px-8">
          <div className="h-px bg-gray-300 grow"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="h-px bg-gray-300 grow"></div>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={() => signInWith('oauth_google')}
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
        <p className="text-sm mt-3">Don't have an account? <a href="/sign-up" className="text-purple-500 hover:underline ">Sign up</a></p>
      </div>
    </div>
  )
}

