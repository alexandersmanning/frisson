/// <reference types="cypress" />
// @ts-nocheck
import settings from "../../settings";

Cypress.Commands.add("login", (user) => {
  cy.visit("http://localhost:80/login.html");
  cy.contains("h2", "Sign in");
  cy.get("input[name=email]").type(settings.testuser.email);

  // {enter} causes the form to submit
  cy.get("input[name=password]").type(`${settings.testuser.password}{enter}`);

  // our auth cookie should be present
  cy.getCookie("userid").should("exist");
  cy.getCookie("token").should("exist");

  // UI should reflect this user being logged in
  cy.contains("h3", "Books");
});

Cypress.Commands.add("newBook", (user) => {
  cy.intercept({
    method: "POST",
    url: "/newBook",
  }).as("postNewBook");

  // Click the New button to add a new book
  cy.get("button[data-label=New]").click();

  cy.wait(5000);

  cy.visit("http://localhost:80/");

  cy.get("p[data-selector='booklist-list-item']").contains("Untitled");
});

Cypress.Commands.add("newChapter", (user) => {
  cy.get("div[data-selector='chapterlist-list']").within(() => {
    cy.get("button[data-label=New]").click();
  });

  cy.wait(2000);

  cy.get("p[data-selector='chapterlist-list-item']").contains("New chapter");
});

Cypress.Commands.add("renameBook", (user) => {
  cy.get("button[data-selector='booklist-list-item-menu-button']").click();

  cy.contains("div", "Rename");
  cy.get("div[data-selector='booklist-list-item-button-Rename']").click();
  cy.get("input[name='Rename Book']").type("test book");
  cy.get("button[data-selector='popup-ok-button']").click();

  cy.wait(5000);

  cy.visit("http://localhost:80/");
  cy.get("p[data-selector='booklist-list-item']").contains("test book");
});

Cypress.Commands.add("renameChapter", (user) => {
  cy.get("button[data-selector='chapterlist-list-item-menu-button']").click();

  cy.contains("div", "Rename");
  cy.get("div[data-selector='chapterlist-list-item-button-Rename']").click();
  cy.get("input[name='Rename Chapter']").type("test chapter");
  cy.get("button[data-selector='popup-ok-button']").click();

  cy.get("p[data-selector='chapterlist-list-item']").contains("test chapter");
});

Cypress.Commands.add("deleteBook", (user) => {
  cy.intercept({
    method: "GET",
    url: "/books",
  }).as("getBooks");

  cy.get("button[data-selector='booklist-list-item-menu-button']").click();
  cy.contains("div", "Delete");
  cy.get("div[data-selector='booklist-list-item-button-Delete']")
    .click()
    .then(() => {
      cy.wait("@getBooks").then((interception) => {
        console.log(interception.response.body);
      });
      cy.get("p[data-selector='booklist-list-item']").should("not.exist");
    });
});

Cypress.Commands.add("deleteChapter", (user) => {
  cy.get("button[data-selector='chapterlist-list-item-menu-button']").click();
  cy.contains("div", "Delete");
  cy.get("div[data-selector='chapterlist-list-item-button-Delete']").click();
  cy.wait(2000);
  cy.get("p[data-selector='chapterlist-list-item']").should("not.exist");
});

Cypress.Commands.add("deleteFirstChapter", (user) => {
  cy.get("button[data-selector='chapterlist-list-item-menu-button']")
    .first()
    .click();
  cy.contains("div", "Delete");
  cy.get("div[data-selector='chapterlist-list-item-button-Delete']").click();
  cy.wait(2000);
  /* cy.get("p[data-selector='chapterlist-list-item']").should("not.exist"); */
});

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
