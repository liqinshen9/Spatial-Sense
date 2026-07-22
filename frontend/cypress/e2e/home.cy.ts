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
    cy.contains("button", /rotate y/i).should("be.visible");
  });
});
