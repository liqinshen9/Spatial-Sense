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

  it("paginates rankings without changing the selected difficulty", () => {
    const paginatedScores = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      rank: index + 1,
      userId: index + 1,
      username: `Player ${index + 1}`,
      avatarUrl: null,
      difficulty: "easy",
      elapsedMilliseconds: 10000 + index * 1000,
      time: `00:${String(10 + index).padStart(2, "0")}.00`,
      createdAt: "2026-01-01T00:00:00Z",
    }));

    cy.intercept("GET", "http://localhost:5000/api/scores?difficulty=easy", {
      body: paginatedScores,
    }).as("getPaginatedScores");

    cy.visitApp("/leaderboard?difficulty=easy");

    cy.wait("@getPaginatedScores");
    cy.contains("Player 1").should("be.visible");
    cy.contains("Player 6").should("not.exist");
    cy.contains(/showing 1-5 of 7/i).should("be.visible");

    cy.contains("button", /^next$/i).click();

    cy.contains("Player 1").should("not.exist");
    cy.contains("Player 6").should("be.visible");
    cy.contains("Player 7").should("be.visible");
    cy.contains(/showing 6-7 of 7/i).should("be.visible");
    cy.location("search").should("contain", "difficulty=easy");

    cy.contains("button", /^prev$/i).click();

    cy.contains("Player 1").should("be.visible");
    cy.contains(/showing 1-5 of 7/i).should("be.visible");
  });

  it("falls back to easy when the difficulty query is invalid", () => {
    cy.intercept("GET", "http://localhost:5000/api/scores?difficulty=easy", {
      body: easyScores,
    }).as("getFallbackScores");

    cy.visitApp("/leaderboard?difficulty=impossible");

    cy.wait("@getFallbackScores");
    cy.contains("Li").should("be.visible");
    cy.contains("button", /^easy$/i).should("be.visible");
  });
});
