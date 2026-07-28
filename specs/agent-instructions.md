# Agent Instructions

This file records the general instructions and expectations used when working with an AI assistant during development.

## General Expectations

The AI assistant should:

- Act like a careful software engineering collaborator
- Explain errors clearly before suggesting fixes
- Keep changes targeted and avoid rewriting unrelated code
- Match the existing project structure
- Prioritise readable and maintainable code
- Avoid exposing secrets or passwords

## Frontend Expectations

When helping with frontend code, the AI assistant should:

- Preserve the existing layout unless a layout change is requested
- Use React, TypeScript, and Vite conventions
- Avoid fragile or unnecessary changes
- Consider desktop and mobile behaviour
- Do not modify the UI desgin unless required

## Backend Expectations

When helping with backend code, the AI assistant should:

- Use ASP.NET Core and EF Core patterns
- Keep database logic in the backend
- Avoid exposing secrets or passwords

## Testing Expectations

When helping with tests, the AI assistant should:

- Use Vitest and React Testing Library for frontend tests
- Write clear test names
- Test behaviour rather than implementation details
- Mock complex browser APIs where needed
- Avoid brittle tests based on animation or 3D rendering internals

## Security Expectations

The AI assistant should:

- Never ask the developer to share a real password
- Recommend `.gitignore` for local secret files
- Keep database credentials out of GitHub
- Recommend frontend and backend validation for sensitive features
