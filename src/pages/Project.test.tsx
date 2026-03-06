import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import Project from './Project'
import { projectApi } from '@/services/projectApi'
import { canvasApi } from '@/services/canvasApi'
import { referenceCollectionApi } from '@/services/referenceCollectionApi'
import type { ProjectData } from '@/types/project'
import type { CanvasSummary } from '@/types/canvas'
import type { ReferenceCollectionSummary } from '@/types/referenceCollection'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'proj-1' }),
  }
})

vi.mock('@/services/projectApi', () => ({
  projectApi: {
    load: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/services/canvasApi', () => ({
  canvasApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@/services/referenceCollectionApi', () => ({
  referenceCollectionApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}))

const mockProject: ProjectData = {
  id: 'proj-1',
  name: 'Test Project',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    { id: 'canvas-1', type: 'canvas' },
    { id: 'col-1', type: 'collection' },
  ],
}

const mockCanvases: CanvasSummary[] = [
  { id: 'canvas-1', name: 'My Canvas', updatedAt: new Date().toISOString(), elementCount: 3 },
]

const mockCollections: ReferenceCollectionSummary[] = [
  { id: 'col-1', name: 'My Collection', updatedAt: new Date().toISOString(), imageCount: 5 },
]

describe('Project Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(projectApi.load).mockResolvedValue(mockProject)
    vi.mocked(projectApi.save).mockResolvedValue(undefined)
    vi.mocked(canvasApi.list).mockResolvedValue(mockCanvases)
    vi.mocked(referenceCollectionApi.list).mockResolvedValue(mockCollections)
  })

  it('should render project name and item count', async () => {
    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText(/2 items/)).toBeInTheDocument()
    })
  })

  it('should display resolved items from the project', async () => {
    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('My Canvas')).toBeInTheDocument()
      expect(screen.getByText('My Collection')).toBeInTheDocument()
    })
  })

  it('should show back to home link', async () => {
    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Back to home'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should show create menu with canvas, collection, and add existing options', async () => {
    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /add to project/i }))

    expect(screen.getByText('New Canvas')).toBeInTheDocument()
    expect(screen.getByText('New Collection')).toBeInTheDocument()
    expect(screen.getByText('Add Existing...')).toBeInTheDocument()
  })

  it('should show empty state when project has no items', async () => {
    vi.mocked(projectApi.load).mockResolvedValue({
      ...mockProject,
      items: [],
    })

    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Empty project')).toBeInTheDocument()
      expect(screen.getByText('Add a canvas or collection to get started')).toBeInTheDocument()
    })
  })

  it('should show not-found state for missing project', async () => {
    vi.mocked(projectApi.load).mockRejectedValue(new Error('Not found'))

    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Project not found')).toBeInTheDocument()
    })
  })

  it('should open add existing dialog showing only items not in the project', async () => {
    // Project already has canvas-1 and col-1; API returns those plus extras
    vi.mocked(canvasApi.list).mockResolvedValue([
      { id: 'canvas-1', name: 'My Canvas', updatedAt: new Date().toISOString(), elementCount: 3 },
      { id: 'canvas-2', name: 'Loose Canvas', updatedAt: new Date().toISOString(), elementCount: 7 },
    ])
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([
      { id: 'col-1', name: 'My Collection', updatedAt: new Date().toISOString(), imageCount: 5 },
      { id: 'col-2', name: 'Loose Collection', updatedAt: new Date().toISOString(), imageCount: 12 },
    ])

    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /add to project/i }))
    await user.click(screen.getByText('Add Existing...'))

    await waitFor(() => {
      expect(screen.getByText('Add existing items')).toBeInTheDocument()
    })

    // Should show items NOT already in the project
    expect(screen.getByText('Loose Canvas')).toBeInTheDocument()
    expect(screen.getByText('Loose Collection')).toBeInTheDocument()

    // Should NOT show items already in the project
    // "My Canvas" and "My Collection" appear in the project items grid,
    // but should not appear in the dialog list
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveTextContent('My Canvas')
    expect(dialog).not.toHaveTextContent('My Collection')
  })

  it('should add selected items to the project when confirmed', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue([
      { id: 'canvas-1', name: 'My Canvas', updatedAt: new Date().toISOString(), elementCount: 3 },
      { id: 'canvas-2', name: 'Loose Canvas', updatedAt: new Date().toISOString(), elementCount: 7 },
    ])
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([
      { id: 'col-1', name: 'My Collection', updatedAt: new Date().toISOString(), imageCount: 5 },
      { id: 'col-2', name: 'Loose Collection', updatedAt: new Date().toISOString(), imageCount: 12 },
    ])

    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /add to project/i }))
    await user.click(screen.getByText('Add Existing...'))

    await waitFor(() => {
      expect(screen.getByText('Loose Canvas')).toBeInTheDocument()
    })

    // Select both available items
    await user.click(screen.getByText('Loose Canvas'))
    await user.click(screen.getByText('Loose Collection'))

    expect(screen.getByText('2 items selected')).toBeInTheDocument()

    // Mock save to resolve and list to return updated items
    vi.mocked(projectApi.save).mockResolvedValue(undefined)
    vi.mocked(canvasApi.list).mockResolvedValue([
      { id: 'canvas-1', name: 'My Canvas', updatedAt: new Date().toISOString(), elementCount: 3 },
      { id: 'canvas-2', name: 'Loose Canvas', updatedAt: new Date().toISOString(), elementCount: 7 },
    ])
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([
      { id: 'col-1', name: 'My Collection', updatedAt: new Date().toISOString(), imageCount: 5 },
      { id: 'col-2', name: 'Loose Collection', updatedAt: new Date().toISOString(), imageCount: 12 },
    ])

    await user.click(screen.getByRole('button', { name: /add 2 items/i }))

    await waitFor(() => {
      expect(projectApi.save).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            { id: 'canvas-1', type: 'canvas' },
            { id: 'col-1', type: 'collection' },
            { id: 'canvas-2', type: 'canvas' },
            { id: 'col-2', type: 'collection' },
          ]),
        })
      )
    })
  })

  it('should filter available items by search text in add existing dialog', async () => {
    vi.mocked(canvasApi.list).mockResolvedValue([
      { id: 'canvas-1', name: 'My Canvas', updatedAt: new Date().toISOString(), elementCount: 3 },
      { id: 'canvas-2', name: 'Landscape Study', updatedAt: new Date().toISOString(), elementCount: 2 },
    ])
    vi.mocked(referenceCollectionApi.list).mockResolvedValue([
      { id: 'col-1', name: 'My Collection', updatedAt: new Date().toISOString(), imageCount: 5 },
      { id: 'col-2', name: 'Portrait Refs', updatedAt: new Date().toISOString(), imageCount: 8 },
    ])

    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /add to project/i }))
    await user.click(screen.getByText('Add Existing...'))

    await waitFor(() => {
      expect(screen.getByText('Landscape Study')).toBeInTheDocument()
      expect(screen.getByText('Portrait Refs')).toBeInTheDocument()
    })

    // Type search text
    await user.type(screen.getByPlaceholderText('Search items...'), 'landscape')

    // Only matching item should remain
    expect(screen.getByText('Landscape Study')).toBeInTheDocument()
    expect(screen.queryByText('Portrait Refs')).not.toBeInTheDocument()
  })

  it('should filter project items by search query', async () => {
    render(
      <BrowserRouter>
        <Project />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('My Canvas')).toBeInTheDocument()
      expect(screen.getByText('My Collection')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/search items in this project/i)
    await user.type(searchInput, 'Canvas')

    expect(screen.getByText('My Canvas')).toBeInTheDocument()
    expect(screen.queryByText('My Collection')).not.toBeInTheDocument()
  })
})
