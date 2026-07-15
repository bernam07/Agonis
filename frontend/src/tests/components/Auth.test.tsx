import { act, forwardRef, useEffect, useImperativeHandle } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { authMock } = vi.hoisted(() => ({
  authMock: {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
  },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: authMock,
  },
}))

// Stubs the real hCaptcha widget (which needs a live browser/network) with one that
// auto-verifies on mount and instantly "re-solves" whenever Auth.tsx resets it, so the
// form's captcha-gated submit buttons unlock immediately for every attempt in the test.
vi.mock('@hcaptcha/react-hcaptcha', () => ({
  default: forwardRef(({ onVerify }: { onVerify: (token: string) => void }, ref) => {
    useImperativeHandle(ref, () => ({ resetCaptcha: () => onVerify('test-captcha-token') }))
    useEffect(() => {
      onVerify('test-captcha-token')
    }, [onVerify])
    return null
  }),
}))

import Auth from '../../components/auth/Auth'
import { renderIntoDocument, setNativeInputValue } from '../testUtils'

describe('Auth', () => {
  it('submits login and signup forms', async () => {
    const onBack = vi.fn()
    const { container, cleanup } = renderIntoDocument(<Auth onBack={onBack} />)

    const inputs = container.querySelectorAll('input')
    const buttons = container.querySelectorAll('button')

    act(() => {
      setNativeInputValue(inputs[0] as HTMLInputElement, 'user@example.com')
      setNativeInputValue(inputs[1] as HTMLInputElement, 'secret123')
    })

    await act(async () => {
      ;(buttons[1] as HTMLButtonElement).click()
    })

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
      options: { captchaToken: 'test-captcha-token' },
    })

    const termsCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    await act(async () => {
      termsCheckbox.click()
    })

    await act(async () => {
      ;(buttons[2] as HTMLButtonElement).click()
    })

    expect(authMock.signUp).toHaveBeenCalled()
    expect(container.textContent).toContain('Account created! Please check your email to verify.')

    ;(buttons[0] as HTMLButtonElement).click()
    expect(onBack).toHaveBeenCalled()

    cleanup()
  })
})
