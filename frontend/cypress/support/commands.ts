/// <reference types="cypress" />

Cypress.Commands.add("visitApp", (path = "/") => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("spatialSenseTutorialSeen", "true");
      win.localStorage.setItem("spatialSenseSoundEnabled", "false");
    },
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      visitApp(path?: string): Chainable<void>;
    }
  }
}

export {};
