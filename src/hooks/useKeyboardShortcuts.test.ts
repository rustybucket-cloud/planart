import { renderHook } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('should call callback when shortcut key is pressed', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: '+', callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('+')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple shortcuts', async () => {
    const zoomIn = vi.fn()
    const zoomOut = vi.fn()
    const shortcuts = [
      { key: '+', callback: zoomIn },
      { key: '-', callback: zoomOut },
    ]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('+')
    expect(zoomIn).toHaveBeenCalledTimes(1)
    expect(zoomOut).not.toHaveBeenCalled()

    await userEvent.keyboard('-')
    expect(zoomOut).toHaveBeenCalledTimes(1)
  })

  it('should not trigger when disabled', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: '+', callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }))

    await userEvent.keyboard('+')
    expect(callback).not.toHaveBeenCalled()
  })

  it('should prevent shortcuts in input fields by default', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'a', callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    await userEvent.keyboard('a')
    expect(callback).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should cleanup event listeners on unmount', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: '+', callback }]

    const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }))
    unmount()

    await userEvent.keyboard('+')
    expect(callback).not.toHaveBeenCalled()
  })

  it('should trigger callback when ctrlOrMeta shortcut is pressed with Ctrl', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'z', ctrlOrMeta: true, callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('{Control>}z{/Control}')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not trigger ctrlOrMeta shortcut without modifier', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'z', ctrlOrMeta: true, callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('z')
    expect(callback).not.toHaveBeenCalled()
  })

  it('should not trigger regular shortcut when modifier is pressed', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'z', callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('{Control>}z{/Control}')
    expect(callback).not.toHaveBeenCalled()
  })

  it('should trigger callback when shift modifier matches', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'z', ctrlOrMeta: true, shift: true, callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not trigger shift shortcut without shift key', async () => {
    const callback = vi.fn()
    const shortcuts = [{ key: 'z', ctrlOrMeta: true, shift: true, callback }]

    renderHook(() => useKeyboardShortcuts({ shortcuts }))

    await userEvent.keyboard('{Control>}z{/Control}')
    expect(callback).not.toHaveBeenCalled()
  })
})
