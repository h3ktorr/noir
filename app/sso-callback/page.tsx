'use client'

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function Page() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  const navigateToSignIn = () => {
    router.push('/sign-in')
  }

  const loadingMessage =
  signIn.status === 'complete'
    ? 'Finalizing sign in...'
    : signUp.status === 'missing_requirements'
      ? 'Preparing your account...'
      : 'Signing you in...';

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        // Handle session tasks
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
        if (session?.currentTask) {
          console.log(session?.currentTask)
          return
        }

        // If no session tasks, navigate the signed-in user to the home page
        const url = decorateUrl('/')
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      },
    })
  }

  const finalizeSignUp = async () => {
    await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        // Handle session tasks
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
        if (session?.currentTask) {
          console.log(session?.currentTask)
          return
        }

        // If no session tasks, navigate the signed-in user to the home page
        const url = decorateUrl('/')
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      },
    })
  }

  useEffect(() => {
    (async () => {
      if (!clerk.loaded || hasRun.current) {
        return
      }
      // Prevent Next.js from re-running this effect when the page is re-rendered during session activation.
      hasRun.current = true

      if (signUp.status === 'missing_requirements') {
        console.log('Missing requirements detected')
        return router.push('/sign-in/continue')
      }

      // If this was a sign-in, and it's complete, there's nothing else to do.
      if (signIn.status === 'complete') {
        await finalizeSignIn()
        return
      }

      // If the sign-up used an existing account, transfer it to a sign-in
      if (signUp.isTransferable) {
        await signIn.create({ transfer: true })
        const signInStatus = signIn.status as typeof signIn.status | 'complete'
        if (signInStatus === 'complete') {
          await finalizeSignIn()
          return
        }

        // If sign-in is not complete, additional information is needed
        // For this example, we'll navigate back to the sign-in page assuming that it handles these cases
        return navigateToSignIn()
      }

      if (
        signIn.status === 'needs_first_factor' &&
        !signIn.supportedFirstFactors?.every((f) => f.strategy === 'enterprise_sso')
      ) {
        // The sign-in requires the use of a configured first factor, so navigate to the sign-in page
        return navigateToSignIn()
      }

      // If the sign-in used an external account not associated with an existing user, create a sign-up
      if (signIn.isTransferable) {
        await signUp.create({ transfer: true })
        if (signUp.status === 'complete') {
          await finalizeSignUp()
          return
        }

        // If sign-up is not complete, additional information is needed
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
        return router.push('/sign-in/continue')
      }

      // If sign-up is complete, finalize it
      if (signUp.status === 'complete') {
        await finalizeSignUp()
        return
      }

      // If the sign-in requires MFA or a new password
      // For this example, we'll navigate back to the sign-in page assuming that it handles these cases
      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
        return navigateToSignIn()
      }

      // The external account used to sign-in or sign-up was already associated with an existing user and active
      // session on this client, so activate the session and navigate to the application.
      if (signIn.existingSession || signUp.existingSession) {
        const sessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId
        if (sessionId) {
          // Because we're activating a session that's not the result of a sign-in or sign-up, we need to use the
          // Clerk `setActive` API instead of the `finalize` API.
          await clerk.setActive({
            session: sessionId,
            navigate: async ({ session, decorateUrl }) => {
              // Handle session tasks
              // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
              if (session?.currentTask) {
                console.log(session?.currentTask)
                return
              }

              // If no session tasks, navigate the signed-in user to the home page
              const url = decorateUrl('/')
              if (url.startsWith('http')) {
                window.location.href = url
              } else {
                router.push(url)
              }
            },
          })
          return
        }
      }
    })()
  }, [clerk, signIn, signUp])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin" />

    <h2 className="mt-4 text-lg font-semibold">
      Please wait...
    </h2>

    <p className="text-sm opacity-70">
      {loadingMessage}
    </p>

    <div id="clerk-captcha" />
  </div>
  )
}