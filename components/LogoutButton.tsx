// components/LogoutButton.tsx

'use client'

import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()

    router.push('/sign-in')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
    >
      Log Out
    </button>
  )
}