'use client'

import { useSignUp, useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react' 

export default function Page() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { signUp, errors, fetchStatus } = useSignUp()
  const { signIn } = useSignIn()

  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setFormError('')

    const missingFields = signUp.missingFields

    const firstNameValue = String(formData.get('firstName') || '').trim()
    const lastNameValue = String(formData.get('lastName') || '').trim()
    const usernameValue = String(formData.get('username') || '')
      .trim()
      .toLowerCase()
    const passwordValue = String(formData.get('password') || '')

    if (missingFields.includes('first_name') && !firstNameValue) {
      setFormError('Please enter your first name.')
      return
    }

    if (missingFields.includes('last_name') && !lastNameValue) {
      setFormError('Please enter your last name.')
      return
    }

    if (missingFields.includes('username') && !usernameValue) {
      setFormError('Please choose a username.')
      return
    }

    if (missingFields.includes('password') && !passwordValue) {
      setFormError('Please enter a password.')
      return
    }

    try {
      setIsLoading(true)

      const updateData = {
        ...(missingFields.includes('first_name') && {
          firstName: firstNameValue,
        }),
        ...(missingFields.includes('last_name') && {
          lastName: lastNameValue,
        }),
        ...(missingFields.includes('username') && {
          username: usernameValue,
        }),
        ...(missingFields.includes('password') && {
          password: passwordValue,
        }),
      }

      const { error } = await signUp.update(updateData)

      if (error) {
        console.error('Signup update error:', error)
        setFormError(
          error.longMessage ||
          error.message ||
          'Unable to update your account. Please try again.'
        )
        return
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log('Session task required:', session.currentTask)
              setFormError('Your account needs one more step before you can continue.')
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

        return
      }

      if (signUp.status === 'missing_requirements') {
        setFormError(
          `Your account still requires: ${signUp.missingFields.join(', ')}.`
        )
        console.error('Remaining missing fields:', signUp.missingFields)
        return
      }

      setFormError('Your signup could not be completed. Please try again.')
    } catch (error) {
      console.error('Continue signup error:', error)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // If the sign-up is complete, the user shouldn't be on this page
  useEffect(() => {
    if (signUp.status === 'complete' || signIn.status === 'complete') {
      router.replace('/')
      return
    }

    if (signUp.status !== 'missing_requirements') {
      router.replace('/sign-in')
    }
  }, [signUp.status, signIn.status, router])

  useEffect(() => {
    console.log('SIGN UP STATUS:', signUp.status)
    console.log('REQUIRED FIELDS:', signUp.requiredFields)
    console.log('MISSING FIELDS:', signUp.missingFields)
    console.log('UNVERIFIED FIELDS:', signUp.unverifiedFields)
    console.log('SIGN UP ID:', signUp.id)
  }, [signUp])

  return (
    <div className="fixed z-50 top-0 self-end w-screen bg-background overflow-auto h-screen flex justify-center items-center">
      <div className="bg-foreground m-auto w-3/4 md:w-[50vw] p-4 sm:px-12 h-10/12 overflow-scroll rounded-2xl flex flex-col items-center text-background pt-12">
        <h1 className="text-2xl font-bold">Complete your account</h1>
        <p className="mt-2 text-center">
          Complete the remaining details to finish creating your account.
        </p>
        <form action={handleSubmit} className="flex flex-col gap-4">

          {signUp.missingFields.includes('first_name') && (
            <div>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full"
              />
              {errors.fields.firstName && (
                <p className="text-sm text-red-500">
                  {errors.fields.firstName.message}
                </p>
              )}
            </div>
          )}

          {signUp.missingFields.includes('last_name') && (
            <div>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full"
              />
              {errors.fields.lastName && (
                <p className="text-sm text-red-500">
                  {errors.fields.lastName.message}
                </p>
              )}
            </div>
          )}

          {signUp.missingFields.includes('username') && (
            <div>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
              {errors.fields.username && (
                <p className="text-sm text-red-500">
                  {errors.fields.username.message}
                </p>
              )}
            </div>
          )}

          {signUp.missingFields.includes('password') && (
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
              {errors.fields.password && (
                <p className="text-sm text-red-500">
                  {errors.fields.password.message}
                </p>
              )}
            </div>
          )}

          {formError && (
            <p className="text-sm text-red-500" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || fetchStatus === 'fetching'}
          >
            {isLoading || fetchStatus === 'fetching'
              ? 'Completing signup...'
              : 'Continue'}
          </button>
        </form>
        <div id="clerk-captcha" />
      </div>
    </div>
  )
}