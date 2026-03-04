import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import Home from './Home'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render page title', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Your Work')).toBeInTheDocument()
  })

  it('should display project and canvas counts in header', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    // The header displays "3 projects · 6 canvases"
    expect(screen.getByText(/3 projects · 6 canvases/i)).toBeInTheDocument()
  })

  it('should render search input', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    const searchInput = screen.getByPlaceholderText(/search canvases and projects/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should render New Canvas button', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: /new canvas/i })).toBeInTheDocument()
  })

  it('should render all mock projects', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    // Projects may appear in multiple places (cards and tabs), so use getAllByText
    expect(screen.getAllByText('Brand Redesign').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Product Mockups').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Website Wireframes').length).toBeGreaterThan(0)
  })
})
