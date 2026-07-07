import { act } from 'react'
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

import Auth from '../../components/auth/Auth'
import { renderIntoDocument } from '../testUtils'

describe('Auth', () => {
  it('submits login and signup forms', async () => {
    const onBack = vi.fn()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container, cleanup } = renderIntoDocument(<Auth onBack={onBack} />)

    const inputs = container.querySelectorAll('input')
    const buttons = container.querySelectorAll('button')

    act(() => {
      ;(inputs[0] as HTMLInputElement).value = 'user@example.com'
      ;(inputs[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }))
      ;(inputs[1] as HTMLInputElement).value = 'secret123'
      ;(inputs[1] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      ;(buttons[1] as HTMLButtonElement).click()
    })

    expect(authMock.signInWithPassword).toHaveBeenCalled()

    await act(async () => {
      ;(buttons[2] as HTMLButtonElement).click()
    })

    expect(authMock.signUp).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith('Account created! You can now log in.')

    ;(buttons[0] as HTMLButtonElement).click()
    expect(onBack).toHaveBeenCalled()

    alertSpy.mockRestore()
    cleanup()
  })
})
