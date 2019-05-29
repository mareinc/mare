describe('logo', () => {

  const horizontalPresets = [
    { name: 'iphone-5', orientation: 'portrait' },
    { name: 'iphone-5', orientation: 'landscape' },
    { name: 'iphone-6', orientation: 'portrait' },
    { name: 'iphone-6+', orientation: 'portrait' },
    { name: 'ipad-mini', orientation: 'portrait' },
    { name: 'ipad-2', orientation: 'portrait' },
    { name: 'macbook-11' },
    { name: 'macbook-13' },
    { name: 'macbook-15' },
  ];

  const verticalPresets = [
    { name: 'iphone-6', orientation: 'landscape' },
    { name: 'iphone-6+', orientation: 'landscape' },
  ];

  before(() => {
    cy.visit('localhost:3000');
  });

  horizontalPresets.forEach(preset => { 
    it(`should be be visible on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.logo--horizontal').should('be.visible')
    });

    it(`should be have the text next to the logo on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.logo--horizontal').should('be.visible')
    });
  });

  verticalPresets.forEach(preset => { 
    it(`should be be visible on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.logo--vertical').should('be.visible')
    });

    it(`should be have the text below the logo on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.logo--vertical').should('be.visible')
    });
  });
});

describe('top navigation bar', () => {

  const visiblePresets = [
    { name: 'iphone-6', orientation: 'landscape' },
    { name: 'iphone-6+', orientation: 'landscape' },
    { name: 'ipad-mini', orientation: 'portrait' },
    { name: 'ipad-2', orientation: 'portrait' },
    { name: 'macbook-11' },
    { name: 'macbook-13' },
    { name: 'macbook-15' },
  ];

  const hiddenPresets = [
    { name: 'iphone-5', orientation: 'portrait' },
    { name: 'iphone-5', orientation: 'landscape' },
    { name: 'iphone-6', orientation: 'portrait' },
    { name: 'iphone-6+', orientation: 'portrait' }
  ];

  before(() => {
    cy.visit('localhost:3000');
  });

  visiblePresets.forEach(preset => {
    it(`should be visible on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.top-nav__items').should('have.css', 'display').and('eq', 'flex')
    });
  });

  hiddenPresets.forEach( preset => {
    it(`should be hidden on an ${ preset.name } in ${ preset.orientation || 'portrait' } mode`, () => {
      cy.viewport(preset.name, preset.orientation);
      cy.get('.top-nav__items').should('have.css', 'display').and('eq', 'none')
    });
  });

  describe('home link', () => {

    it('should navigate correctly', () => {
      cy.get('.top-nav__link--home').click();
      cy.url().should('be', 'http://localhost:3000');
    });
  });

  describe('register button', () => {

    it('should navigate correctly', () => {
      cy.get('.top-nav__link--register').click();
      cy.url().should('include', '/register');
    });
  });

  describe('log in button', () => {

    it('should open the modal', () => {
      cy.get('.top-nav__button--log-in').click();
      cy.get('.modal__container').should('have.css', 'display').and('eq', 'block')
    });

    it('should populate the modal with the log in form', () => {
      cy.get('.log-in-container').should('exist');
    });

    after(() => {
      cy.get('.modal__close').click();
    })
  });

  describe('donate button', () => {

    it('should navigate correctly', () => {
      cy.get('.top-nav__button--donate').click();
      cy.url().should('include', '/donate');
    });
  });
});