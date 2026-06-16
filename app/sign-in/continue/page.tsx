'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { signUp } = useSignUp()

  const handleSubmit = async (formData: FormData) => {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    // Update the `SignUp` object with the missing fields
    // This example collects first and last name and passes it to SignUp.update() but you can modify this example for whatever settings you have enabled in the Clerk Dashboard
    await signUp.update({ firstName, lastName })

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
    <div>
      <h1>Continue sign-up</h1>
      <form action={handleSubmit}>
        <label htmlFor="firstName">First name</label>
        <input type="text" name="firstName" id="firstName" />
        <label htmlFor="lastName">Last name</label>
        <input type="text" name="lastName" id="lastName" />

        <button type="submit">Submit</button>
      </form>

      {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </div>
  )
}