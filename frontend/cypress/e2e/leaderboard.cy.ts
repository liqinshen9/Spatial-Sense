const easyScores = [
  {
    id: 1,
    rank: 1,
    userId: 1,
    username: "Li",
    avatarUrl: null,
    difficulty: "easy",
    elapsedMilliseconds: 12345,
    time: "00:12.34",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    rank: 2,
    userId: 2,
    username: "Alex",
    avatarUrl: null,
    difficulty: "easy",
    elapsedMilliseconds: 20000,
    time: "00:20.00",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("leaderboard", () => {
  it("loads scores and switches difficulty tabs", () => {
    cy.intercept("GET", "http://localhost:5000/api/scores?difficulty=easy", {
      body: easyScores,
    }).as("getEasyScores");

    cy.intercept("GET", "http://localhost:5000/api/scores?difficulty=medium", {
      body: [],
    }).as("getMediumScores");

    cy.visitApp("/leaderboard?difficulty=easy");

    cy.wait("@getEasyScores");
    cy.contains("Li").should("be.visible");
    cy.contains("Alex").should("be.visible");
    cy.contains("00:12.34").should("be.visible");

    cy.contains("button", /medium/i).click();

    cy.wait("@getMediumScores");
    cy.location("search").should("contain", "difficulty=medium");
    cy.contains(/no scores yet/i).should("be.visible");
  });
});
