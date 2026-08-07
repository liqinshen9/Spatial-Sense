# AI-Assisted Development Prompt Log

This file records prompts used during development. These prompts show how AI assistance was used for frontend features, backend work, testing, and documentation.

## Frontend Prompts

### Improve the light mode home page UI

Please help design a clean and attractive light mode UI for the homepage of my 3D spatial reasoning game. The homepage should feel polished and inviting because it is the first page users see.

Please try a #EAF4FF background with #1D4ED8 primary buttons and #FACC15 yellow highlights for the light mode homepage. Keep the same layout, but make the page feel brighter, cleaner, and easier to read.

Please try a #FFF7E6 background with #FFFFFF cards, #2563EB buttons, and #F59E0B highlights for the light mode homepage. I want to see whether a warmer background looks more comfortable than a plain white background.

Please try a #FEF9C3 background with #DBEAFE panels, #1E40AF primary text, and #EAB308 accent buttons for the light mode homepage. The dark theme already uses blue and yellow, so I want to see whether this can keep the same game identity in light mode.

Please compare the #EAF4FF/#1D4ED8/#FACC15, #FFF7E6/#2563EB/#F59E0B, #FEF9C3/#DBEAFE/#1E40AF, and #FFFFFF/#002FA5/#00D4FF/#E9FBFF versions. Tell me which colour direction fits the 3D spatial reasoning game best.

Please use a #FFFFFF background with #002FA5 primary text, #00D4FF highlights, #00AEE6 hover states, and #E9FBFF secondary surfaces for the light mode homepage.

### Improve the 3D block preview

Please adjust the 3D block preview so that it is visually clear, centred, and consistent with the game theme.

### Improve mobile responsiveness

Please improve the mobile version of the game page so that the controls remain usable and the main 3D view stays readable.

### Improve the leaderboard

Please improve the leaderboard layout by adding pagination, and avoiding unnecessary scrolling.

### Check signed-in navbar layout

On the mobile view, please check that the navbar does not break or become misaligned when the user is signed in.

## Tutorial Prompts

### Add tutorial mode

Please implement a tutorial mode that guides users through the main interface. It should highlight key frontend elements and provide short explanations.

### Improve tutorial positioning

Please make the tutorial overlay wait for the target element before positioning the highlight, so it does not flash or appear in the wrong place.

### Improve tutorial behaviour on mobile

Please adjust the tutorial overlay so that it does not overlap with important controls on mobile screens.

### Add a rotation demonstration

Please add a final tutorial step that demonstrates how rotating around the Y axis by 90 degrees changes the block. The modal should show Current, Controls, and Target.

### Reduce tutorial highlight size

Please reduce the padding around the tutorial highlight border so that it fits the target more closely.

### Change tutorial wording

Please replace all "Skip" with "Exit" in tutorial mode.

## Game Logic Prompts

### Add procedurally generated puzzles

Please help explain to me how to create puzzle generation logic so the game can provide different spatial reasoning challenges instead of relying only on fixed examples.

### Add difficulty-specific puzzle behaviour

Please implement different puzzle behaviour for Easy, Medium, and Difficult modes. Easy should stay simple, and users can solve them with 2-3 rotations. Users should be able to solve Medium puzzles with 4-5 rotations, while Difficult should require more rotations and involve 45 degree rotations. 

### Add difficult mode penalty

Please add a time penalty for difficult mode. Extra rotations after the free steps should add penalty time, and reset should not reset the timer or penalty.

## Authentication Prompts

### Improve registration and login

Please improve the authentication flow so users can register, log in, and save scores.

### Handle user not found

Please update the login flow so that if the user is not found, the interface switches to registration mode and shows a clear message.

### Add password restrictions

Please add password validation for registration. Passwords should be at least eight characters long and include an uppercase letter, lowercase letter, number, and special character. The validation should exist on both frontend and backend.

## Sound and Feedback Prompts

### Add sound effects

Please add simple sound effects for button clicks, start game, puzzle solved, game complete, errors, warnings, and sound toggle actions.

### Add loading animation

Please create a reusable loading component that matches the visual style of the game.

## Backend and Azure SQL Prompts

### Diagnose database connection issues

Please help diagnose why the backend cannot connect to Azure SQL. Identify whether the problem is authentication, firewall rules, serverless pause, or the connection string.

### Use SQL authentication

Please help switch the project to SQL authentication for Azure SQL because Microsoft Entra authentication is causing local development issues.

### View database content

Please explain how to view Azure SQL database tables and records using Azure Portal Query Editor.

### Handle Azure SQL serverless pause

Please explain why the database sometimes fails on the first request after being inactive and help reduce this issue with backend retry handling.

## Testing Prompts

### Add frontend tests

Please write unit tests for key frontend components. The tests should be easy to read, logically organised, and focused on important user-facing functionality.

### Fix test configuration

Please help fix Vitest configuration errors and make the frontend test setup work with Vite and TypeScript.

### Align tests with real component props

Please update tests so they match the actual component props used in the project.

### Add tutorial tests

Please add tests for the tutorial overlay, including normal steps, button actions, and the rotation demo modal.

### Explain test warnings

Please explain why tests pass but warnings appear, and help mock 3D Canvas rendering cleanly.

## CI and DevOps Prompts

### Explain Docker

Please explain what it means to dockerise a project and when Docker is useful for a full-stack web application.

### Explain CI/CD

Please explain whether CI/CD can be added before the web app is finished and how it relates to Azure web hosting.

### Add CI only

Please help create a GitHub Actions CI workflow that runs frontend tests, builds the frontend, restores backend dependencies, and builds the backend. Do not add deployment yet!

## Documentation Prompt
### Explain context/config and agent instructions

Please explain the difference between context/config and agent instructions in AI-assisted development. Explain what each one means, what kind of information belongs in each category, and why separating them helps keep AI-assisted project work clearer and more organised.

### Create specs folder

Please create a simple `/specs` folder with Markdown files that document AI-assisted development prompts, agent instructions, and context/config notes.
