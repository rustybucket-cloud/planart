## Instructions

### Process

- Look at the current state of relevant features inside /docs/features. Update the docs when making changes.
- Look at the relevant visual design principles in /docs/visual-design. Reuse patterns and aesthetics to keep a clean, consistent app. Add and update files as needed.
- Do not start the server unless the user asks you to. They likely already have it running.
- If you made made code changes, run `npm run lint:fix` before finishing to make sure the code has no lint issues
- When adding a new feature or fixing a bug, create tests with vitest and react testing library. Only add valuable tests. Never add useless tests.
- When adding tests, create one test at a time, making sure it passes before moving on to the next test

### Information

- Use Shadcn for UI components. If a Shadcn component is not installed, use the cli to install it.
    - Example: `npx shadcn@latest add button`
- Features and techinical documentation is stored in /docs

### Code Style

- Don't store derived state in a `useState`
- Components should be small and self-contained
- When possible, functions should be pure functions outside of react components.
