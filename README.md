# Spatial Sense

Spatial Sense is a gamified spatial reasoning test where players solve a series of 3D block-rotation puzzles as quickly and accurately as possible. Instead of answering traditional static test questions, the player interacts with a live 3D object, rotates it around the X, Y, and Z axes, and tries to match it to a target shape.

The project is built as a full-stack web application with a React frontend and an ASP.NET Core backend. It includes generated spatial puzzles, selectable difficulty levels, timed gameplay, user accounts, score saving, and a leaderboard.

## How the Project Relates to Gamification

The theme of this project is gamification. Spatial Sense applies game design ideas to a spatial reasoning test so the assessment feels more engaging, motivating, and replayable.

The core test still measures spatial reasoning because players must mentally rotate and compare 3D objects. However, the experience is gamified through:

- Timed levels that encourage focus and replay.
- Easy, Medium, and Difficult modes for progression.
- A 10-puzzle game loop with visible progress.
- Score saving so players can improve their personal best.
- A leaderboard that ranks players by completion time.
- Sound effects, completion feedback, and visual success states.
- An animated tutorial that teaches the controls before or during play.

This turns a normal spatial reasoning activity into a challenge-based game where the player can practise, compete, and improve.

## What Makes the Project Unique

Spatial Sense is unique because it combines a real cognitive skill test with interactive 3D gameplay. The player is not just choosing an answer from a list; they directly manipulate the object and must understand how each rotation changes the shape.

The puzzle system also creates variety. The backend generates many connected block shapes across multiple difficulties, including coloured cubes that make orientation matching more precise. Difficult puzzles can require 45-degree rotations and include a penalty system, which adds strategy because unnecessary moves increase the final time.

The project is worth highlighting because it is more than a visual demo. It includes a complete user flow: players can learn through the tutorial, play a timed test, register or log in, save scores, upload an avatar, and compare their ranking on the leaderboard.

## Basic Requirements

These are the basic requirements checklists.

## Top 3 Advanced Features Implemented

These are the top 3 advanced features I would like marked:



## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router, Three.js, React Three Fiber.
- Backend: ASP.NET Core (.NET 10), Entity Framework Core, SQL Server
- Testing: Vitest, Cypress, xUnit.

## Running the Project

Start the backend:

```bash
cd backend
dotnet run
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Then open the local frontend URL shown by Vite.
