import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Home from './Home'
import { canvasApi } from '@/services/canvasApi'
import type { CanvasSummary } from '@/types/canvas'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/services/canvasApi', () => ({
  canvasApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockCanvases: CanvasSummary[] = [
  { id: 'canvas-1', name: 'First Canvas', updatedAt: new Date().toISOString(), elementCount: 2 },
  { id: 'canvas-2', name: 'Second Canvas', updatedAt: new Date().toISOString(), elementCount: 0 },
]

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(canvasApi.list).mockResolvedValue([])
  })

  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Your Work')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/0 canvases/)).toBeInTheDocument()
    })
  })

  it('should display canvas count in header', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/0 canvases/)).toBeInTheDocument()
    })
  })

  it('should render search input', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/0 canvases/)).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText(/search canvases and projects/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should render New Canvas button', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: /new canvas/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/0 canvases/)).toBeInTheDocument()
    })
  })

  it('should render canvases from list', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
      expect(screen.getByText('Second Canvas')).toBeInTheDocument()
    })
  })

  it('should delete canvas when delete button is clicked and user confirms', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(canvasApi.delete).mockResolvedValue(undefined)
    const confirmSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirmSpy)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstCanvasRow = screen.getByText('First Canvas').closest('div.group')
    const deleteButton = firstCanvasRow!.querySelector('button')!
    await user.click(deleteButton)

    await waitFor(() => {
      expect(canvasApi.delete).toHaveBeenCalledWith('canvas-1')
    })
    expect(screen.queryByText('First Canvas')).not.toBeInTheDocument()
    expect(screen.getByText('Second Canvas')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('should show error and keep canvas when delete fails', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(canvasApi.delete).mockRejectedValue(new Error('Delete failed'))
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    const alertSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstCanvasRow = screen.getByText('First Canvas').closest('div.group')
    const deleteButton = firstCanvasRow!.querySelector('button')!
    await user.click(deleteButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete canvas. Try again.')
    })
    expect(screen.getByText('First Canvas')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
