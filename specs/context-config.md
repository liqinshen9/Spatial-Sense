# Context and Configuration Notes

This file records the project context and configuration information used to guide development.

## Project Context

Spatial Sense is a full-stack 3D spatial reasoning game.

The project uses:

- React, TypeScript, and Vite for the frontend
- React Router, Redux Toolkit, Three.js, and React Three Fiber for frontend interaction and 3D rendering
- Tailwind CSS through the Vite plugin for frontend styling support
- ASP.NET Core for the backend
- Entity Framework Core for database access
- Azure SQL Database for persistent storage
- Vitest and React Testing Library for frontend tests
- Cypress for end-to-end frontend tests
- xUnit for backend tests
- GitHub Actions for Continuous Integration (CI)

## Planned Structure

The project was planned with three main application layers:

- Frontend: user interface, homepage, login, leaderboard, tutorial, and game page
- Backend: authentication, score handling, puzzle-related logic, and API endpoints
- Database: user information, score records, difficulty levels, and leaderboard data

Pproject structure:

```text
spatial-reasoning-test/
|-- frontend/
|-- backend/
|-- backend.Tests/
|-- specs/
|-- .github/workflows/
```

## Frontend Configuration

Frontend testing uses:

- Vitest
- jsdom
- React Testing Library
- jest-dom matchers
- Mocked browser APIs such as ResizeObserver, matchMedia, Canvas, and Web Audio
- Cypress for browser end-to-end tests

The Vite config includes:

- React plugin
- Tailwind CSS plugin
- Vitest `test` configuration using the `jsdom` environment and `src/test/setup.ts`

The Cypress config uses `http://localhost:5173` as the end-to-end test base URL.

## Backend Configuration

The backend targets .NET 10 and reads the Azure SQL connection string from backend configuration using the `DefaultConnection` key.

For local development, the connection string should be stored in:

```text
backend/appsettings.Development.json
```

This file should not be committed.

The committed `backend/appsettings.json` keeps `ConnectionStrings:DefaultConnection` empty so secrets are not stored in source control.

The backend is configured to:

- Run locally at `http://localhost:5000`
- Allow CORS requests from the Vite frontend at `http://localhost:5173`
- Use EF Core SQL Server with retry handling enabled
- Serve uploaded avatar files from `backend/wwwroot/uploads/avatars`
- Expose OpenAPI and Scalar API reference endpoints
- Apply rate limiting to API, authentication, and write actions

## Azure SQL Configuration

Important Azure SQL settings:

- SQL authentication is used for local development
- The server firewall must allow the developer's current IP
- EF Core migrations exist for the initial schema, authentication and scores, and user avatars
- Retry handling is enabled in the backend for temporary SQL connection failures, including serverless wake-up delays

## Secret Handling

The project should not commit:

```text
backend/appsettings.Development.json
```

The `.gitignore` file should include:

```gitignore
appsettings.Development.json
```

The connection string should never be placed in frontend code.

## CI Configuration

The GitHub Actions CI workflow is stored at:

```text
.github/workflows/ci.yml
```

The workflow runs on push and pull request events targeting `main`.

The frontend CI job:

- Uses Node.js 24
- Installs dependencies with `npm ci`
- Runs frontend tests with `npm run test:run`
- Builds the frontend with `npm run build`

The backend CI job:

- Uses the .NET 10 SDK
- Restores backend dependencies
- Builds the backend in Release configuration
- Runs the backend xUnit test project

The CI workflow does not deploy the application and should not require Azure SQL secrets.
