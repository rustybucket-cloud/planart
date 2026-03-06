import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Home from './Home'
import { canvasApi } from '@/services/canvasApi'
import { referenceCollectionApi } from '@/services/referenceCollectionApi'
import { projectApi } from '@/services/projectApi'
import type { CanvasSummary } from '@/types/canvas'
import type { ReferenceCollectionSummary } from '@/types/referenceCollection'
import type { ProjectSummary, ProjectData } from '@/types/project'

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

vi.mock('@/services/referenceCollectionApi', () => ({
  referenceCollectionApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/services/projectApi', () => ({
  projectApi: {
    list: vi.fn(),
    load: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockCanvases: CanvasSummary[] = [
  { id: 'canvas-1', name: 'First Canvas', updatedAt: new Date().toISOString(), elementCount: 2 },
  { id: 'canvas-2', name: 'Second Canvas', updatedAt: new Date().toISOString(), elementCount: 0 },
]

const mockCollections: ReferenceCollectionSummary[] = [
  { id: 'col-1', name: 'Color References', updatedAt: new Date().toISOString(), imageCount: 5 },
  { id: 'col-2', name: 'Architecture Refs', updatedAt: new Date().toISOString(), imageCount: 0 },
]

const mockProjects: ProjectSummary[] = [
  { id: 'proj-1', name: 'My Project', updatedAt: new Date().toISOString(), itemCount: 1 },
]

const mockProjectDetails: ProjectData[] = [
  { id: 'proj-1', name: 'My Project', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [{ id: 'canvas-1', type: 'canvas' }] },
]

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(canvasApi.list).mockResolvedValue([])
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([])
    vi.mocked(projectApi.list).mockResolvedValue([])
  })

  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Your Work')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/0 items/)).toBeInTheDocument()
    })
  })

  it('should display combined item count in header (excluding items inside projects)', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(referenceCollectionApi.list).mockResolvedValue(mockCollections)
    vi.mocked(projectApi.list).mockResolvedValue(mockProjects)
    vi.mocked(projectApi.load).mockResolvedValue(mockProjectDetails[0])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    // 2 canvases + 2 collections + 1 project = 5, but canvas-1 is in proj-1, so 4 visible items
    await waitFor(() => {
      expect(screen.getByText(/4 items/)).toBeInTheDocument()
    })
  })

  it('should render search input', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/0 items/)).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText(/search projects, canvases, and collections/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should show create menu with project, canvas, and collection options', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const newButton = screen.getByRole('button', { name: /create new/i })
    await user.click(newButton)

    expect(screen.getByText('New Project')).toBeInTheDocument()
    expect(screen.getByText('New Canvas')).toBeInTheDocument()
    expect(screen.getByText('New Collection')).toBeInTheDocument()
  })

  it('should navigate to /canvas/new when New Canvas is clicked', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /create new/i }))
    await user.click(screen.getByText('New Canvas'))

    expect(mockNavigate).toHaveBeenCalledWith('/canvas/new')
  })

  it('should navigate to /collection/new when New Collection is clicked', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('First Canvas')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /create new/i }))
    await user.click(screen.getByText('New Collection'))

    expect(mockNavigate).toHaveBeenCalledWith('/collection/new')
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

  it('should render collections from list', async () => {
    vi.mocked(referenceCollectionApi.list).mockResolvedValue(mockCollections)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Color References')).toBeInTheDocument()
      expect(screen.getByText('Architecture Refs')).toBeInTheDocument()
    })
  })

  it('should hide items that belong to a project', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([])
    vi.mocked(projectApi.list).mockResolvedValue(mockProjects)
    vi.mocked(projectApi.load).mockResolvedValue(mockProjectDetails[0])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    // canvas-1 is in the project so it should be hidden
    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument()
    })
    expect(screen.queryByText('First Canvas')).not.toBeInTheDocument()
    expect(screen.getByText('Second Canvas')).toBeInTheDocument()
  })

  it('should show projects in the home list', async () => {
    vi.mocked(projectApi.list).mockResolvedValue(mockProjects)
    vi.mocked(projectApi.load).mockResolvedValue(mockProjectDetails[0])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument()
    })
  })

  it('should filter items by search query including projects', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(referenceCollectionApi.list).mockResolvedValue(mockCollections)
    vi.mocked(projectApi.list).mockResolvedValue(mockProjects)
    vi.mocked(projectApi.load).mockResolvedValue(mockProjectDetails[0])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'My Project')

    expect(screen.getByText('My Project')).toBeInTheDocument()
    expect(screen.queryByText('Second Canvas')).not.toBeInTheDocument()
    expect(screen.queryByText('Color References')).not.toBeInTheDocument()
  })
})
