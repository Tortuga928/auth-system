// ***********************************************
// Custom Cypress Commands for Authentication System
// ***********************************************

import '@testing-library/cypress/add-commands';

/**
 * Login command - logs in a user
 * @example cy.login('user@example.com', 'password123')
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

/**
 * Register command - registers a new user
 * @example cy.register('user@example.com', 'password123', 'John Doe')
 */
Cypress.Commands.add('register', (email, password, name) => {
  cy.visit('/register');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="confirmPassword"]').type(password);
  cy.get('button[type="submit"]').click();
});

/**
 * Logout command - logs out current user
 */
Cypress.Commands.add('logout', () => {
  cy.get('button').contains(/logout|sign out/i).click();
});

/**
 * Set auth token - manually sets authentication token
 * @example cy.setAuthToken('fake-jwt-token')
 */
Cypress.Commands.add('setAuthToken', (token) => {
  window.localStorage.setItem('token', token);
});

/**
 * Clear auth - clears authentication data
 */
Cypress.Commands.add('clearAuth', () => {
  window.localStorage.clear();
  cy.clearCookies();
});

/**
 * Check if user is on dashboard
 */
Cypress.Commands.add('shouldBeOnDashboard', () => {
  cy.url().should('include', '/dashboard');
  cy.contains(/dashboard|welcome/i).should('be.visible');
});

/**
 * Check if user is on login page
 */
Cypress.Commands.add('shouldBeOnLogin', () => {
  cy.url().should('include', '/login');
  cy.contains(/login|sign in/i).should('be.visible');
});
