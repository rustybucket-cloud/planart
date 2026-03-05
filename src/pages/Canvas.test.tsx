import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Canvas from './Canvas'
import { resetPendingNewCanvasIdForTesting } from './canvasNewRefState'
import { canvasApi } from '@/services/canvasApi'
import type { CanvasData } from '@/types/canvas'

const mockNavigate = vi.fn()
const mockUseParams = vi.fn(() => ({ id: 'test-canvas' } as { id: string }))
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

vi.mock('@/services/canvasApi', () => ({
  canvasApi: {
    create: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
  },
}))

const defaultCanvas: CanvasData = {
  id: 'test-canvas',
  name: 'Test Canvas',
  createdAt: '',
  updatedAt: '',
  viewport: { x: 0, y: 0, zoom: 1 },
  elements: [],
}

// Helper to render Canvas with router
const renderCanvas = async () => {
  const result = render(
    <BrowserRouter>
      <Canvas />
    </BrowserRouter>
  )
  await waitFor(() => {
    expect(screen.queryByText('Loading canvas...')).not.toBeInTheDocument()
  })
  return result
}

// Helper to get canvas area (the fixed div with inset-0)
const getCanvasArea = () => {
  return document.querySelector('.fixed.inset-0') as HTMLElement
}

describe('Canvas Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(canvasApi.load).mockResolvedValue(defaultCanvas)
  })

  describe('Text Placement Mode', () => {
    it('should enter placement mode when clicking Text button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

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
      await renderCanvas()

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
      await renderCanvas()

      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      // Press Escape
      await user.keyboard('{Escape}')

      // Should exit placement mode
      const canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-default')
      expect(canvas?.className).not.toContain('cursor-crosshair')
    })

    it('should place text element on canvas click during placement mode', async () => {
      const user = userEvent.setup()
      await renderCanvas()

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
      await renderCanvas()
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
      await renderCanvas()
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
      await renderCanvas()
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
      await renderCanvas()
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
      await renderCanvas()

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

  describe('Canvas Rename', () => {
    it('should show input when double-clicking canvas name', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvasName = screen.getByText('Test Canvas')
      await user.dblClick(canvasName)

      const input = screen.getByDisplayValue('Test Canvas')
      expect(input.tagName).toBe('INPUT')
    })

    it('should rename canvas when pressing Enter', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvasName = screen.getByText('Test Canvas')
      await user.dblClick(canvasName)

      const input = screen.getByDisplayValue('Test Canvas')
      await user.clear(input)
      await user.type(input, 'Renamed Canvas{Enter}')

      expect(screen.getByText('Renamed Canvas')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Renamed Canvas')).not.toBeInTheDocument()
    })

    it('should rename canvas on blur', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvasName = screen.getByText('Test Canvas')
      await user.dblClick(canvasName)

      const input = screen.getByDisplayValue('Test Canvas')
      await user.clear(input)
      await user.type(input, 'Blur Rename')

      await act(async () => {
        fireEvent.blur(input)
      })

      expect(screen.getByText('Blur Rename')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should not rename canvas when pressing Escape', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvasName = screen.getByText('Test Canvas')
      await user.dblClick(canvasName)

      const input = screen.getByDisplayValue('Test Canvas')
      await user.clear(input)
      await user.type(input, 'Should Not Save{Escape}')

      expect(screen.getByText('Test Canvas')).toBeInTheDocument()
      expect(screen.queryByText('Should Not Save')).not.toBeInTheDocument()
    })
  })

  describe('Zoom Controls', () => {
    it('should zoom in when clicking zoom in button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const zoomInButton = screen.getByTitle('Zoom In (+)')
      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      expect(zoomDisplay).toHaveTextContent('100%')

      await user.click(zoomInButton)
      expect(zoomDisplay).toHaveTextContent('120%')
    })

    it('should zoom out when clicking zoom out button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const zoomOutButton = screen.getByTitle('Zoom Out (-)')
      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.click(zoomOutButton)
      expect(zoomDisplay).toHaveTextContent('83%')
    })

    it('should reset zoom when clicking zoom display', async () => {
      const user = userEvent.setup()
      await renderCanvas()

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
      await renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')
      expect(zoomDisplay).toHaveTextContent('100%')

      await user.keyboard('+')
      expect(zoomDisplay).toHaveTextContent('120%')
    })

    it('should zoom out with - key', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.keyboard('-')
      expect(zoomDisplay).toHaveTextContent('83%')
    })

    it('should reset zoom with 0 key', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const zoomDisplay = screen.getByTitle('Reset Zoom (0)')

      await user.keyboard('+')
      await user.keyboard('+')
      expect(zoomDisplay).not.toHaveTextContent('100%')

      await user.keyboard('0')
      expect(zoomDisplay).toHaveTextContent('100%')
    })
  })

  describe('Image Upload and Placement', () => {
    it('should trigger file input when clicking image button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      // Get the hidden file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')

      const imageButton = screen.getByTitle('Add Image (I)')
      await user.click(imageButton)

      expect(clickSpy).toHaveBeenCalled()
      clickSpy.mockRestore()
    })

    it('should enter image placement mode after file selection', async () => {
      await renderCanvas()

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create a mock file
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      // Mock Image loading
      const originalImage = globalThis.Image
      globalThis.Image = class MockImage {
        width = 100
        height = 100
        onload: (() => void) | null = null
        set src(_: string) {
          // Trigger onload asynchronously
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      // Simulate file selection
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
        // Wait for setTimeout in mock Image
        await new Promise((r) => setTimeout(r, 10))
      })

      // Should be in placement mode - canvas should have crosshair cursor
      const canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-crosshair')

      // Image button should show active state
      const imageButton = screen.getByTitle('Add Image (I)')
      expect(imageButton.className).toContain('ring-2')

      globalThis.Image = originalImage
    })

    it('should exit image placement mode when pressing Escape', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['dummy'], 'test.png', { type: 'image/png' })

      const originalImage = globalThis.Image
      globalThis.Image = class MockImage {
        width = 100
        height = 100
        onload: (() => void) | null = null
        set src(_: string) {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
        await new Promise((r) => setTimeout(r, 10))
      })

      // Verify we're in placement mode
      let canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-crosshair')

      // Press Escape
      await user.keyboard('{Escape}')

      // Should exit placement mode
      canvas = getCanvasArea()
      expect(canvas?.className).toContain('cursor-default')

      globalThis.Image = originalImage
    })
  })

  describe('Context Menu', () => {
    it('should delete element via context menu', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      // Place a text element
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()

      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      // Save with some text
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Delete Me{Enter}')

      // Wait for text to appear
      await waitFor(() => {
        expect(screen.getByText('Delete Me')).toBeInTheDocument()
      })

      // Right-click on the element to open context menu
      const textElement = screen.getByText('Delete Me')
      await user.pointer({ keys: '[MouseRight]', target: textElement })

      // Wait for context menu to appear and click delete
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
      })

      const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteMenuItem)

      // Element should be removed
      await waitFor(() => {
        expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
      })
    })

    it('should duplicate element via context menu', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      // Place a text element
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Clone Me{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Clone Me')).toBeInTheDocument()
      })

      // Right-click to open context menu
      const textElement = screen.getByText('Clone Me')
      await user.pointer({ keys: '[MouseRight]', target: textElement })

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('menuitem', { name: /duplicate/i }))

      // Should now have two elements with the same text
      await waitFor(() => {
        expect(screen.getAllByText('Clone Me')).toHaveLength(2)
      })
    })

    it('should show text size buttons in context menu for text elements', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      // Place a text element
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Size Test{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Size Test')).toBeInTheDocument()
      })

      // Right-click to open context menu
      const textElement = screen.getByText('Size Test')
      await user.pointer({ keys: '[MouseRight]', target: textElement })

      // Should see all size buttons
      await waitFor(() => {
        expect(screen.getByText('XS')).toBeInTheDocument()
        expect(screen.getByText('SM')).toBeInTheDocument()
        expect(screen.getByText('MD')).toBeInTheDocument()
        expect(screen.getByText('LG')).toBeInTheDocument()
        expect(screen.getByText('XL')).toBeInTheDocument()
      })
    })

    it('should change text size when clicking a size button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      // Place a text element
      const textButton = screen.getByTitle('Add Text (T)')
      await user.click(textButton)

      const canvas = getCanvasArea()
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 500, clientY: 400, button: 0 })
        await new Promise((r) => setTimeout(r, 10))
      })

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Resize Me{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Resize Me')).toBeInTheDocument()
      })

      // Text should default to md size (18px)
      const textParagraph = screen.getByText('Resize Me')
      expect(textParagraph.style.fontSize).toBe('18px')

      // Right-click to open context menu
      await user.pointer({ keys: '[MouseRight]', target: textParagraph })

      await waitFor(() => {
        expect(screen.getByText('XL')).toBeInTheDocument()
      })

      // Click XL size
      await user.click(screen.getByText('XL'))

      // Text should now be 40px
      await waitFor(() => {
        expect(screen.getByText('Resize Me').style.fontSize).toBe('40px')
      })
    })
  })

  describe('New canvas creation', () => {
    beforeEach(() => {
      resetPendingNewCanvasIdForTesting()
      mockUseParams.mockReturnValue({ id: 'new' })
      vi.mocked(canvasApi.create).mockResolvedValue({
        id: 'new-canvas-id',
        name: 'Untitled Canvas',
        createdAt: '',
        updatedAt: '',
        viewport: { x: 0, y: 0, zoom: 1 },
        elements: [],
      })
    })

    it('should call canvasApi.create exactly once when id is "new"', async () => {
      render(
        <BrowserRouter>
          <Canvas />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(canvasApi.create).toHaveBeenCalledTimes(1)
        expect(canvasApi.create).toHaveBeenCalledWith('Untitled Canvas')
      })
    })
  })

  describe('Box Select', () => {
    const canvasWithElements: CanvasData = {
      id: 'test-canvas',
      name: 'Test Canvas',
      createdAt: '',
      updatedAt: '',
      viewport: { x: 0, y: 0, zoom: 1 },
      elements: [
        { id: 'el-1', type: 'text', x: 100, y: 100, width: 200, height: 60, content: 'Element One' },
        { id: 'el-2', type: 'text', x: 400, y: 100, width: 200, height: 60, content: 'Element Two' },
        { id: 'el-3', type: 'text', x: 100, y: 300, width: 200, height: 60, content: 'Element Three' },
      ],
    }

    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: 'test-canvas' })
      vi.mocked(canvasApi.load).mockResolvedValue(canvasWithElements)
    })

    it('should show box select rectangle while dragging on empty space', async () => {
      await renderCanvas()

      const canvas = getCanvasArea()

      // Start box select by left-clicking on empty space
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 })
      })

      // Move mouse to draw selection rectangle
      await act(async () => {
        fireEvent.mouseMove(window, { clientX: 350, clientY: 250 })
      })

      // Should render a selection rectangle
      const selectionRect = canvas!.querySelector('.border-terracotta\\/60.bg-terracotta\\/10')
      expect(selectionRect).toBeInTheDocument()
    })

    it('should select multiple elements within the box select area', async () => {
      await renderCanvas()

      const canvas = getCanvasArea()

      // Box-select area covering el-1 and el-2 (both at y=100, x=100 and x=400)
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 })
      })

      await act(async () => {
        fireEvent.mouseMove(window, { clientX: 650, clientY: 200 })
      })

      await act(async () => {
        fireEvent.mouseUp(window)
      })

      // Both elements should have selected style (ring-2 ring-terracotta)
      const el1 = screen.getByText('Element One').closest('.absolute')
      const el2 = screen.getByText('Element Two').closest('.absolute')

      expect(el1?.className).toContain('ring-2 ring-terracotta')
      expect(el2?.className).toContain('ring-2 ring-terracotta')
    })

    it('should clear selection when clicking on empty space', async () => {
      await renderCanvas()

      const canvas = getCanvasArea()

      // First, select elements with box select
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 })
      })
      await act(async () => {
        fireEvent.mouseMove(window, { clientX: 650, clientY: 200 })
      })
      await act(async () => {
        fireEvent.mouseUp(window)
      })

      // Verify elements are selected
      const el1 = screen.getByText('Element One').closest('.absolute')
      expect(el1?.className).toContain('ring-2 ring-terracotta')

      // Click on empty space to deselect
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 500, button: 0 })
      })
      await act(async () => {
        fireEvent.mouseUp(window)
      })

      // Elements should no longer be selected
      expect(el1?.className).not.toContain('ring-2 ring-terracotta shadow-lg')
    })

    it('should delete all selected elements with Delete key', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvas = getCanvasArea()

      // Box select el-1 and el-2
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 })
      })
      await act(async () => {
        fireEvent.mouseMove(window, { clientX: 650, clientY: 200 })
      })
      await act(async () => {
        fireEvent.mouseUp(window)
      })

      // Verify both are selected
      expect(screen.getByText('Element One')).toBeInTheDocument()
      expect(screen.getByText('Element Two')).toBeInTheDocument()

      // Press Delete
      await user.keyboard('{Delete}')

      // Both should be removed
      await waitFor(() => {
        expect(screen.queryByText('Element One')).not.toBeInTheDocument()
        expect(screen.queryByText('Element Two')).not.toBeInTheDocument()
      })

      // Element Three should still exist
      expect(screen.getByText('Element Three')).toBeInTheDocument()
    })

    it('should cancel box select with Escape', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const canvas = getCanvasArea()

      // Start box select
      await act(async () => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 })
      })
      await act(async () => {
        fireEvent.mouseMove(window, { clientX: 350, clientY: 250 })
      })

      // Box select rect should be visible
      let selectionRect = canvas!.querySelector('.border-terracotta\\/60.bg-terracotta\\/10')
      expect(selectionRect).toBeInTheDocument()

      // Press Escape
      await user.keyboard('{Escape}')

      // Box select rect should be gone
      selectionRect = canvas!.querySelector('.border-terracotta\\/60.bg-terracotta\\/10')
      expect(selectionRect).not.toBeInTheDocument()
    })
  })

  describe('Export Dialog', () => {
    it('should open export dialog when clicking export button', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Export Canvas')).toBeInTheDocument()
      })
    })

    it('should show empty state message when canvas has no elements', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText('No elements to export.')).toBeInTheDocument()
      })
    })

    it('should show element count when canvas has elements', async () => {
      const canvasWithElements: CanvasData = {
        id: 'test-canvas',
        name: 'Test Canvas',
        createdAt: '',
        updatedAt: '',
        viewport: { x: 0, y: 0, zoom: 1 },
        elements: [
          { id: 'el-1', type: 'text', x: 100, y: 100, width: 200, height: 60, content: 'Element One' },
          { id: 'el-2', type: 'text', x: 400, y: 100, width: 200, height: 60, content: 'Element Two' },
        ],
      }
      vi.mocked(canvasApi.load).mockResolvedValue(canvasWithElements)

      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText('Elements: 2')).toBeInTheDocument()
      })
    })

    it('should close dialog when clicking cancel', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should have disabled export button when no elements', async () => {
      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        const pngExportButton = screen.getByRole('button', { name: /export png/i })
        expect(pngExportButton).toBeDisabled()
      })
    })

    it('should have enabled export button when canvas has elements', async () => {
      const canvasWithElements: CanvasData = {
        id: 'test-canvas',
        name: 'Test Canvas',
        createdAt: '',
        updatedAt: '',
        viewport: { x: 0, y: 0, zoom: 1 },
        elements: [
          { id: 'el-1', type: 'text', x: 100, y: 100, width: 200, height: 60, content: 'Test Element' },
        ],
      }
      vi.mocked(canvasApi.load).mockResolvedValue(canvasWithElements)

      const user = userEvent.setup()
      await renderCanvas()

      const exportButton = screen.getByTitle('Export Canvas')
      await user.click(exportButton)

      await waitFor(() => {
        const pngExportButton = screen.getByRole('button', { name: /export png/i })
        expect(pngExportButton).toBeEnabled()
      })
    })
  })
})
