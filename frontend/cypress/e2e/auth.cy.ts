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

  it("closes the login modal without navigating away", () => {
    cy.visitApp("/");

    cy.contains("button", /^login$/i).click();
    cy.contains("h2", /welcome back/i).should("be.visible");

    cy.get('button[aria-label="Close"]').click();

    cy.contains("h2", /welcome back/i).should("not.exist");
    cy.location("pathname").should("eq", "/");
  });

  it("prefills registration from the login identifier", () => {
    cy.visitApp("/");

    cy.contains("button", /^login$/i).click();
    cy.contains("label", /username or email/i)
      .find("input")
      .type("mira@example.com");
    cy.contains("button", /sign up here/i).click();

    cy.contains("h2", /join spatial sense/i).should("be.visible");
    cy.contains("label", /^email$/i)
      .find("input")
      .should("have.value", "mira@example.com");
  });

  it("validates weak registration passwords before submitting", () => {
    cy.visitApp("/");

    cy.contains("button", /^login$/i).click();
    cy.contains("button", /sign up here/i).click();

    cy.contains("label", /^username$/i).find("input").type("Mira");
    cy.contains("label", /^email$/i).find("input").type("mira@example.com");
    cy.get("#register-password").type("weak");
    cy.contains("label", /confirm password/i).find("input").type("weak");
    cy.contains("button", /^create account$/i).click();

    cy.contains(/password must be at least 8 characters/i).should("exist");
  });
});
