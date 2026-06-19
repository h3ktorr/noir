'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { signUp } = useSignUp()

  const handleSubmit = async (formData: FormData) => {
    const username = formData.get('username') as string

    // Update the `SignUp` object with the missing fields
    // This example collects first and last name and passes it to SignUp.update() but you can modify this example for whatever settings you have enabled in the Clerk Dashboard
    await signUp.update({
      username,
    } as any)

    if (signUp.status === 'complete') {
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
    } else if (signUp.status !== 'missing_requirements') {
      // Check why the sign-up is not complete
      console.error('Sign-up attempt not complete:', signUp.status)
    }
  }

  // If the sign-up is complete, the user shouldn't be on this page
  if (signUp.status === 'complete') {
    router.push('/')
  }

  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h1 className="text-2xl font-bold">Complete your account</h1>
        <p className="mt-2 text-center">
          Your email has been verified. Please choose a username to finish creating your account.
        </p>
        <form className="flex flex-col mt-6 gap-3 w-full px-8" action={handleSubmit}>
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
          <button 
            type="submit" 
            className="bg-background text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition mt-4 cursor-pointer">
            Create account
          </button>
        </form>
        <div id="clerk-captcha" />
      </div>
    </div>
  )
}