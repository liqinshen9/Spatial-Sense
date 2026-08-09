const easyPuzzle = {
  id: 1,
  seed: 123,
  difficulty: "easy",
  cubes: [
    { x: 0, y: 0, z: 0, colorIndex: 0 },
    { x: 1, y: 0, z: 0, colorIndex: 1 },
  ],
  targetOrientation: { x: 0, y: 0, z: 0, w: 1 },
  solutionMoves: [{ axis: "Y", degrees: 90 }],
};

Cypress.on("uncaught:exception", (error) => {
  if (
    error.message.includes(
      "Cannot read properties of null (reading 'addEventListener')"
    )
  ) {
    return false;
  }
});

function selectDifficulty(index: number) {
  cy.get('input[aria-label="Select difficulty"]').then(($input) => {
    const input = $input[0];
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    valueSetter?.call(input, String(index));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("home and game navigation", () => {
  it("changes difficulty and starts a game", () => {
    cy.intercept("GET", "http://localhost:5000/api/puzzles/random?difficulty=*", {
      body: easyPuzzle,
    }).as("getEasyPuzzle");

    cy.visitApp("/");

    cy.contains(/spatial/i).should("be.visible");
    cy.contains("Easy").should("be.visible");
    cy.contains("button", /start game/i).click();

    cy.wait("@getEasyPuzzle");
    cy.location("pathname").should("eq", "/game");
    cy.contains(/target/i).should("be.visible");
    cy.contains("button", /^Y axis$/i).should("be.visible");
    cy.get('button[aria-label="Rotate Y axis by 90 degrees"]')
      .should("be.visible");
  });

  it("starts the selected difficult game and shows penalty status", () => {
    cy.intercept(
      "GET",
      "http://localhost:5000/api/puzzles/random?difficulty=Difficult",
      {
        body: {
          ...easyPuzzle,
          difficulty: "difficult",
          targetOrientation: { x: 0, y: 0.7071, z: 0, w: 0.7071 },
        },
      }
    ).as("getDifficultPuzzle");

    cy.visitApp("/");

    selectDifficulty(2);

    cy.contains("Difficult").should("be.visible");
    cy.contains("You've been warned").should("be.visible");

    cy.contains("button", /start game/i).click();

    cy.wait("@getDifficultPuzzle");
    cy.location("pathname").should("eq", "/game");
    cy.contains("Level:").should("be.visible");
    cy.contains("Difficult").should("be.visible");
    cy.contains(/3 free steps left/i).should("be.visible");
    cy.contains(/total penalty: \+0s/i).should("be.visible");
  });

  it("shows a recoverable puzzle loading error state", () => {
    cy.intercept("GET", "http://localhost:5000/api/puzzles/random?difficulty=Easy", {
      statusCode: 400,
      body: { message: "No puzzle available." },
    }).as("getPuzzleFailure");

    cy.visitApp("/game");

    cy.wait("@getPuzzleFailure");
    cy.contains(/failed to load puzzle/i).should("be.visible");
    cy.get('button[aria-label="Rotate Y axis by 90 degrees"]')
      .should("be.visible");
  });

  it("confirms before leaving an active game", () => {
    cy.intercept("GET", "http://localhost:5000/api/puzzles/random?difficulty=Easy", {
      body: {
        ...easyPuzzle,
        targetOrientation: { x: 0, y: 0.7071, z: 0, w: 0.7071 },
      },
    }).as("getActivePuzzle");

    cy.intercept("GET", "http://localhost:5000/api/scores?difficulty=easy", {
      body: [],
    }).as("getScores");

    cy.visitApp("/");
    cy.contains("button", /start game/i).click();
    cy.wait("@getActivePuzzle");

    cy.contains("a", /^leaderboard$/i).click();

    cy.contains("h2", /leave game/i).should("be.visible");
    cy.contains(/score will not be saved/i).should("be.visible");

    cy.contains("button", /^stay$/i).click();
    cy.location("pathname").should("eq", "/game");
    cy.contains("h2", /leave game/i).should("not.exist");

    cy.contains("a", /^leaderboard$/i).click();
    cy.contains("button", /^leave$/i).click();

    cy.wait("@getScores");
    cy.location("pathname").should("eq", "/leaderboard");
  });
});
