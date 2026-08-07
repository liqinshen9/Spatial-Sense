describe("authentication modal", () => {
  it("validates login and register form states", () => {
    cy.visitApp("/");

    cy.contains("button", /^login$/i).click();
    cy.contains("button", /^log in$/i).click();

    cy.contains(/please enter your username\/email and password/i)
      .should("be.visible");

    cy.contains("button", /sign up here/i).click();
    cy.contains("h2", /join spatial sense/i).should("be.visible");

    cy.contains("label", /username/i).find("input").type("Li");
    cy.contains("label", /^email$/i).find("input").type("li@example.com");
    cy.get("#register-password").type("Password123!");
    cy.contains("label", /confirm password/i).find("input").type("different-password");
    cy.contains("button", /^create account$/i).click();

    cy.contains(/passwords do not match/i).should("exist");
  });
});
