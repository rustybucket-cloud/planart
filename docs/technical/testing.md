# Testing Guide

## Overview

Planart uses Vitest and React Testing Library for unit and integration testing.

## Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Open Vitest UI in browser
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test File Organization

Tests are co-located with source files using the `.test.tsx` or `.test.ts` suffix:

```
src/
├── components/ui/
│   ├── button.tsx
│   └── button.test.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useKeyboardShortcuts.test.ts
└── pages/
    ├── Home.tsx
    └── Home.test.tsx
```

## Writing Tests

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should handle click events', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()

  render(<Button onClick={handleClick}>Click me</Button>)
  await user.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalled()
})
```

### Hook Testing

```typescript
import { renderHook } from '@testing-library/react'

it('should call callback', async () => {
  const callback = vi.fn()
  renderHook(() => useKeyboardShortcuts({ shortcuts: [{ key: '+', callback }] }))

  await userEvent.keyboard('+')
  expect(callback).toHaveBeenCalled()
})
```

### Testing Pages with React Router

Always wrap pages in BrowserRouter:

```typescript
import { BrowserRouter } from 'react-router'

render(
  <BrowserRouter>
    <Home />
  </BrowserRouter>
)
```

## Best Practices

1. **User-Centric**: Query by role, label, or text (not implementation details)
2. **Async Events**: Always use `userEvent.setup()` and await interactions
3. **Mock Externals**: Tauri APIs are automatically mocked in setup file
4. **Descriptive**: Use `it('should...')` format for clarity
