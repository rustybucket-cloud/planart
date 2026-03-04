import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Canvas from './Canvas'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-canvas' }),
  }
})

// Helper to render Canvas with router
const renderCanvas = () => {
  return render(
    <BrowserRouter>
      <Canvas />
    </BrowserRouter>
  )
}

// Helper to get canvas area (the fixed div with inset-0)
const getCanvasArea = () => {
  return document.querySelector('.fixed.inset-0') as HTMLElement
}

describe('Canvas Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Text Placement Mode', () => {
    it('should enter placement mode when clicking Text button', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      // Button should show active state
      expect(textButton.className).toContain('bg-terracotta/20')
      expect(textButton.className).toContain('ring-2')

      // Canvas should have crosshair cursor
      const canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-crosshair')
    })

    it('should exit placement mode when clicking Text button again', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const textButton = screen.getByTitle('Add Text (T)')

      // Enter placement mode
      await user.click(textButton)
      expect(textButton.className).toContain('bg-terracotta/20')

      // Exit placement mode
      await user.click(textButton)
      expect(textButton.className).not.toContain('ring-2')
    })

    it('should exit placement mode when pressing Escape', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      // Press Escape
      await user.keyboard('{Escape}')

      // Should exit placement mode
      const canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-move')
      expect(canvas?.className).not.toContain('cursor-crosshair')
    })

    it('should place text element on canvas click during placement mode', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      // Click on canvas area
      const canvas = getCanvasArea()

      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        // Allow setTimeout to run
        await new Promise((r) => setTimeout(r, 10))
      })

      // Should find textarea (edit mode)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Text Editing', () => {
    // Helper to place a text element and get textarea
    const placeTextElement = async (user: ReturnType<typeof userEvent.setup>) => {
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()

      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      return screen.getByRole('textbox')
    }

    it('should save text on Enter key', async () => {
      const user = userEvent.setup()
      renderCanvas()
      const textarea = await placeTextElement(user)

      // Type some text and press Enter
      await user.type(textarea, 'Hello World{Enter}')

      // Should show the saved text (not in textarea anymore)
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    it('should cancel edit on Escape key', async () => {
      const user = userEvent.setup()
      renderCanvas()
      const textarea = await placeTextElement(user)

      // Type some text then Escape
      await user.type(textarea, 'Hello World{Escape}')

      // Should not have textarea visible
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    it('should save text on blur', async () => {
      const user = userEvent.setup()
      renderCanvas()
      const textarea = await placeTextElement(user)

      // Type some text
      await user.type(textarea, 'Blur Test')

      // Blur the textarea
      await act(async () => {
        fireEvent.blur(textarea)
      })

      // Should show the saved text
      await waitFor(() => {
        expect(screen.getByText('Blur Test')).toBeInTheDocument()
      })
    })

    it('should show placeholder when saving empty text', async () => {
      const user = userEvent.setup()
      renderCanvas()
      const textarea = await placeTextElement(user)

      // Just press Enter without typing
      await user.type(textarea, '{Enter}')

      // Should show placeholder text
      await waitFor(() => {
        expect(screen.getByText('Double-click to edit')).toBeInTheDocument()
      })
    })
  })

  describe('Double-click to Edit', () => {
    it('should enter edit mode on double-click', async () => {
      const user = userEvent.setup()
      renderCanvas()

      // First place a text element
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()

      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      // Save with some text
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test Text{Enter}')

      // Wait for text to appear
      await waitFor(() => {
        expect(screen.getByText('Test Text')).toBeInTheDocument()
      })

      // Find the text element and double-click
      const textElement = screen.getByText('Test Text')
      await user.dblClick(textElement)

      // Should be in edit mode
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
    })
  })

  describe('Zoom Controls', () => {
    it('should zoom in when clicking zoom in button', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomInButton = screen.getByTitle('Zoom In (+)')
      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      expect(zoomDisplay).toHaveTextContent('100%')

      await user.click(zoomInButton)
      expect(zoomDisplay).toHaveTextContent('120%')
    })

    it('should zoom out when clicking zoom out button', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomOutButton = screen.getByTitle('Zoom Out (-)')
      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.click(zoomOutButton)
      expect(zoomDisplay).toHaveTextContent('83%')
    })

    it('should reset zoom when clicking zoom display', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomInButton = screen.getByTitle('Zoom In (+)')
      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      // Zoom in first
      await user.click(zoomInButton)
      await user.click(zoomInButton)
      expect(zoomDisplay).not.toHaveTextContent('100%')

      // Reset
      await user.click(zoomDisplay)
      expect(zoomDisplay).toHaveTextContent('100%')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should zoom in with + key', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')
      expect(zoomDisplay).toHaveTextContent('100%')

      await user.keyboard('+')
      expect(zoomDisplay).toHaveTextContent('120%')
    })

    it('should zoom out with - key', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.keyboard('-')
      expect(zoomDisplay).toHaveTextContent('83%')
    })

    it('should reset zoom with 0 key', async () => {
      const user = userEvent.setup()
      renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.keyboard('+')
      await user.keyboard('+')
      expect(zoomDisplay).not.toHaveTextContent('100%')

      await user.keyboard('0')
      expect(zoomDisplay).toHaveTextContent('100%')
    })
  })
})
