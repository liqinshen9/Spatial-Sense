# Spatial Sense
Spatial Sense is a gamified spatial reasoning test where players solve a series of 3D block-rotation puzzles as quickly and accurately as possible. Instead of answering traditional static test questions, the player interacts with a live 3D object, rotates it around the X, Y, and Z axes, and tries to match it to a target shape.

The project is built as a full-stack web application with a React frontend. This project uses .NET for the backend, implemented as an ASP.NET Core Web API with Entity Framework Core for database access. It includes generated spatial puzzles, selectable difficulty levels, timed gameplay, user accounts, score saving, and a leaderboard.

## How the Project Relates to Gamification

Spatial Sense adds gamification features to a traditional static spatial reasoning test. The goal is to make the assessment feel more engaging, motivating, and replayable.

The core skill is still spatial reasoning, because players need to mentally rotate and compare 3D objects. The gamified parts are added around that core activity:

- Timed levels that encourage focus and replay.
- Easy, Medium, and Difficult modes for progression.
- A 10-puzzle game loop with visible progress.
- Score saving so players can improve their personal best.
- A leaderboard that ranks players by completion time.
- Sound effects, completion feedback, and visual success states.
- An animated tutorial that teaches the controls before or during play.

Together, these features turn a boring spatial reasoning activity into a challenge-based game where players can practise, compete, and improve over time.

## What Makes the Project Unique

Spatial Sense is worth highlighting because it is not only a normal learning app with points or a leaderboard added on top. A lot of gamified learning projects still keep the main activity quite static, such as answering quiz questions or clicking through levels. My project makes the spatial reasoning test activity itself interactive. The player does not just look at a shape and choose an answer. They rotate the 3D block directly, see how the shape changes, and use that interaction to test their spatial reasoning.

Another feature that makes the project different is the puzzle system. The backend does not only show one fixed set of questions. It generates connected block shapes across different difficulties, so the test has more variety. I also added coloured cubes because they make the orientation more precise. Without colours, some blocks can look too similar after rotation, but the coloured cubes force the player to pay attention to the exact direction of the shape.

<img src="./docs/images/colored-blocks.png" alt="Colored blocks" width="360">

The difficult mode is also more than just making the blocks harder. It can include 45-degree rotations and a penalty system. This means the player needs to think before rotating, because unnecessary moves can increase the final time. I think this makes the game feel more like a proper challenge instead of just a simple 3D toy.

<img src="./docs/images/penalty.png" alt="Penalty" width="360">

Overall, the unique part of Spatial Sense is that it combines the test, the interaction, and the gamification into one complete flow. The tutorial teaches the controls, the timer and progress make the test feel structured, the penalty system adds strategy, and the saved scores and leaderboard let players compare and improve over time.

## Basic Requirements

These are the basic requirements checklists.

## Top 3 Advanced Features Implemented

Top three advanced features to mark are:

- [x] **Theme switching**

  The app supports light and dark mode. The selected theme is managed through the global app state and applied across the interface so the gamepage, navigation, leaderboard, modals, and tutorial remain visually consistent.

- [x] **State management library**

  The frontend uses Redux Toolkit for application-wide state management. It manages shared state such as the selected difficulty, logged-in user, theme mode, sound setting, tutorial progress, modal visibility, pending scores, and warnings before leaving an active game. This keeps the app state consistent across the home page, game page, leaderboard, authentication modal, profile modal, and tutorial.

- [x] **End-to-end testing using Cypress**

  The project includes Cypress end-to-end tests for important user flows, including authentication, the home page, tutorial behaviour, and leaderboard behaviour. These tests help verify that the frontend works correctly from a user's perspective and that key interactions continue to work as the application changes.

Other advanced features implemented:

4. **Security measures**

   The project implements multiple security measures that are important for protecting user accounts and backend APIs. Passwords are not stored as plain text; they are hashed before being saved and verified during login. The backend also validates user input for registration, login, score saving, avatar uploads, and user updates so invalid or unsafe data is rejected before it reaches the database. API rate limiting is also used to reduce brute-force login attempts, and repeated write requests.

   The project also includes error handling for common invalid input and temporary service issues. Empty login or registration fields, weak passwords, duplicate usernames or emails, invalid score submissions, missing users, and unsupported avatar files are rejected with clear API responses. On the frontend, loading, empty, and failure states are shown for leaderboard and account actions, while retry handling helps reduce failures caused by temporary database wake-up delays.

5. **API protection and optimisation**

   The backend uses separate rate-limiting policies for general API requests, authentication requests, and write requests. This improves reliability by reducing excessive traffic to sensitive endpoints such as login, registration, and score submission.

## Deployment

- Application: [https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/](https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/)
- Backend API prefix: `https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/api`
- Example API endpoint: [https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/api/puzzles/random](https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/api/puzzles/random)
- Scalar API docs: [https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/scalar/v1](https://spatial-sense-api-ajacahh2gpa7hrhz.japaneast-01.azurewebsites.net/scalar/v1)

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router, Three.js, React Three Fiber.
- Backend: ASP.NET Core (.NET 10), Entity Framework Core, SQL Server, OpenAPI, Scalar API docs.
- Deployment: Azure App Service for the deployed ASP.NET Core app, backend API, static frontend assets, and API documentation.
- Testing: Vitest, Cypress, xUnit.

## Running the Project

### 1. Clone the repository

```bash
git clone https://github.com/liqinshen9/Spatial-Sense.git
cd spatial-reasoning-test
```

### 2. Set up the backend database

The backend uses ASP.NET Core (.NET 10), Entity Framework Core, and SQL Server. Before running the backend, add the SQL Server connection string to `backend/appsettings.json`.

For security, the real database connection string is stored in a separate local text file. Copy that connection string and paste it into the empty `DefaultConnection` value inside `backend/appsettings.json`.

```json
"ConnectionStrings": {
  "DefaultConnection": "please-paste-your-connection-string-here"
}
```

### 3. Apply the database migrations

From the backend folder, run:

```bash
cd backend
dotnet ef database update
```

If `dotnet ef` is not installed, install it first:

```bash
dotnet tool install --global dotnet-ef
```

### 4. Start the backend

In one terminal, from the `backend` folder, run:

```bash
dotnet run
```

The backend runs at:

```text
http://localhost:5000
```

### 5. Install and start the frontend

In a second terminal, from the project root, run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at the local URL shown by Vite, usually:

```text
http://localhost:5173
```

Make sure the backend is still running while using the frontend, because the frontend calls the backend API for authentication, puzzles, avatars, and leaderboard scores.


## Self Reflection

I am very proud of the project idea because I think a gamified spatial reasoning test has strong potential. It makes an abstract cognitive skill more interactive, visual, and engaging for users. However, I also recognize that the project is not perfect.

If I were to do this project again, I would explore adding more transformation types, more varied shapes, and more puzzle mechanics. I did not implement too many extra transformations in this version because I wanted to avoid increasing the user's cognitive load and keep the interface clear and easy to understand.

I would also improve the procedural puzzle generation system. The current backend does filter out some weak puzzles, such as targets that are already solved, targets where important coloured cubes are hidden, and Medium/Difficult puzzles that can be solved with only simple 90-degree rotations. However, it does not fully prevent every possible symmetrical or ambiguous shape. With more time, I would add stronger symmetry detection so generated puzzles are more consistently fair and challenging.

With more time, I would also design the interface more carefully in Figma before development. This would help me test different layouts, improve the visual hierarchy, and make the gameplay experience even more polished and intuitive.
