
'use client'

import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function Page() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()

  const hasRun = useRef(false)

  const [callbackError, setCallbackError] = useState('')

  const navigateToSignIn = () => {
    router.replace('/sign-in')
  }

  const navigateToHome = (decorateUrl: (url: string) => string) => {
    const url = decorateUrl('/')

    if (url.startsWith('http')) {
      window.location.href = url
    } else {
      router.replace(url)
    }
  }

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.warn('Pending session task:', session.currentTask)
          setCallbackError(
            'Your account requires an additional security step. Please contact support.'
          )
          return
        }

        navigateToHome(decorateUrl)
      },
    })
  }

  const finalizeSignUp = async () => {
    await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.warn('Pending session task:', session.currentTask)
          setCallbackError(
            'Your account requires an additional security step. Please contact support.'
          )
          return
        }

        navigateToHome(decorateUrl)
      },
    })
  }

  const isSignInComplete = () => {
    return signIn.status === 'complete'
  }

  const isSignUpComplete = () => {
    return signUp.status === 'complete'
  }

  const isSignUpMissingRequirements = () => {
    return signUp.status === 'missing_requirements'
  }

  useEffect(() => {
    if (!clerk.loaded || hasRun.current) {
      return
    }

    hasRun.current = true

    const handleCallback = async () => {
      try {
        // A new Google signup may need additional information.
        if (signUp.status === 'missing_requirements') {
          router.replace('/sign-in/continue')
          return
        }

        // Existing Google account: complete sign-in.
        if (signIn.status === 'complete') {
          await finalizeSignIn()
          return
        }

        // Transfer an existing signup attempt into sign-in.
        if (signUp.isTransferable) {
          const { error } = await signIn.create({ transfer: true })

          if (error) {
            console.error('Sign-in transfer error:', error)

            setCallbackError(
              error.longMessage ||
              'Unable to transfer your account to sign in. Please try again.'
            )
            return
          }

          if (isSignInComplete()) {
            await finalizeSignIn()
            return
          }

          console.log('Sign-in status after transfer:', signIn.status)
          navigateToSignIn()
          return
        }

        // The sign-in requires another authentication factor.
        if (
          signIn.status === 'needs_first_factor' &&
          !signIn.supportedFirstFactors?.every(
            (factor) => factor.strategy === 'enterprise_sso'
          )
        ) {
          navigateToSignIn()
          return
        }

        console.log('Sign-in status:', signIn.status)
        console.log('Sign-in transferable:', signIn.isTransferable)
        console.log('Sign-up status:', signUp.status)
        console.log('Sign-up transferable:', signUp.isTransferable)

        // Transfer an external sign-in attempt into signup.
        if (signIn.isTransferable) {
          const { error } = await signUp.create({ transfer: true })

          if (error) {
            console.error('Sign-up transfer error:', error)

            setCallbackError(
              error.longMessage ||
              'Unable to create your account. Please try again.'
            )
            return
          }

          if (isSignUpComplete()) {
            await finalizeSignUp()
            return
          }

          if (isSignUpMissingRequirements()) {
            router.replace('/sign-in/continue')
            return
          }

          console.error(
            'Signup did not complete after transfer:',
            signUp.status
          )

          setCallbackError(
            'We could not complete your Google registration. Please return to sign in and try again.'
          )
          return
        }

        // A completed signup can be finalized directly.
        if (isSignUpComplete()) {
          await finalizeSignUp()
          return
        }

        // Handle other authentication requirements.
        if (
          signIn.status === 'needs_second_factor' ||
          signIn.status === 'needs_new_password' ||
          signIn.status === 'needs_client_trust'
        ) {
          navigateToSignIn()
          return
        }

        // Activate an existing session if one is available.
        if (signIn.existingSession || signUp.existingSession) {
          const sessionId =
            signIn.existingSession?.sessionId ||
            signUp.existingSession?.sessionId

          if (sessionId) {
            await clerk.setActive({
              session: sessionId,
              navigate: async ({ session, decorateUrl }) => {
                if (session?.currentTask) {
                  console.warn(
                    'Pending session task:',
                    session.currentTask
                  )

                  setCallbackError(
                    'Your account requires an additional security step. Please contact support.'
                  )
                  return
                }

                navigateToHome(decorateUrl)
              },
            })

            return
          }
        }

        // No recognized successful or recoverable state.
        console.error('Unexpected OAuth callback state:', {
          signInStatus: signIn.status,
          signUpStatus: signUp.status,
          signInTransferable: signIn.isTransferable,
          signUpTransferable: signUp.isTransferable,
        })

        setCallbackError(
          'We could not complete authentication. Please return to sign in and try again.'
        )
      } catch (error) {
        console.error('SSO callback error:', error)

        setCallbackError(
          error instanceof Error
            ? error.message
            : 'An unexpected authentication error occurred. Please try again.'
        )
      }
    }

    void handleCallback()
  }, [clerk, signIn, signUp, router])

  const loadingMessage =
    signIn.status === 'complete'
      ? 'Finalizing sign in...'
      : signUp.status === 'missing_requirements'
        ? 'Preparing your account...'
        : 'Signing you in...'

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      {callbackError ? (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <h2 className="text-xl font-semibold">
            Authentication unsuccessful
          </h2>

          <p className="text-sm text-red-500" role="alert">
            {callbackError}
          </p>

          <button
            type="button"
            onClick={navigateToSignIn}
            className="rounded-lg bg-foreground px-6 py-3 text-background"
          >
            Return to sign in
          </button>
        </div>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin" />

          <h2 className="mt-4 text-lg font-semibold">
            Please wait...
          </h2>

          <p className="text-sm opacity-70">
            {loadingMessage}
          </p>
        </>
      )}

      <div id="clerk-captcha" />
    </div>
  )
}
