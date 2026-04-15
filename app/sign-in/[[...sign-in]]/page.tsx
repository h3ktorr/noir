"use client"

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react';

const SignInPage = () => {
  const { signIn, fetchStatus, errors } = useSignIn();
  const [step, setStep] = useState('start');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const handleStart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    await signIn.create({
      identifier: email,
    })

    setStep('password') // move to next step
  };

  return (
    <div>
      {step === 'start' && (
        <form onSubmit={handleStart}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Continue</button>
        </form>
      )}
      {step === 'password' && (
        <form onSubmit={(e) => {
          e.preventDefault();
        }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign In</button>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={(e) => {
          e.preventDefault();
        }}>
          <input
            type="text"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit">Verify</button>
        </form>
      )}

    </div>
  )
}

export default SignInPage