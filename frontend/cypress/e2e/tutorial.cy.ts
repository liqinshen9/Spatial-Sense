describe("tutorial", () => {
  it("opens from the navbar and advances through early steps", () => {
    cy.visitApp("/");

    cy.contains("button", /^tutorial$/i).click();

    cy.contains("Step 1 of").should("be.visible");
    cy.contains("h2", /^tutorial$/i).should("be.visible");

    cy.contains("button", /^next$/i).click();
    cy.contains("h2", /choose difficulty/i).should("be.visible");

    cy.contains("button", /^exit$/i).click();
    cy.contains("Step 2 of").should("not.exist");
  });
});
