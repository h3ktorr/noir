// components/LogoutButton.tsx

'use client'

import { useClerk } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const { signOut } = useClerk()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()

      router.push('/sign-in')
    } catch (err) {
      console.error(err)
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-2 md:px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
    >
      {isLoggingOut ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Logging out...
        </span>
      ) : (
        'Log Out'
      )}
    </button>
  )
}