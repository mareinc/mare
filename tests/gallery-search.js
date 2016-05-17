var chai = require('chai'),
	expect = chai.expect,
	sinon = require('sinon');

chai.use(require('sinon-chai'));

describe('Searching for Children', function () {
	var validator, configuration;
	context('as an anonymous user:', function () {

		beforeEach(function () {
			configuration = sinon.stub();
		});

		context('filtering based on gender', function() {
			it('should filter when one gender is provided');
			it('should filter when multiple genders are provided');
		});

		context('filtering based on number of siblings', function() {
			it('should filter when only a minimum is provided');
			it('should filter when only a maximum is provided');
			it('should filter when the minimum is less than the maximum');
			it('should filter when the minimum and maximum are the same');
			it('should return an error when the maximum is less than the minimum');
		});

		context('filtering based on age', function() {
			it('should filter when only a minimum is provided');
			it('should filter when only a maximum is provided');
			it('should filter when the minimum is less than the maximum');
			it('should filter when the minimum and maximum are the same');
			it('should return an error when the maximum is less than the minimum');
		});


		context('filtering based on race', function() {
			it('should filter when one race is provided');
			it('should filter when multiple races are provided');
		});

		context('filtering based on primary language', function() {
			it('should filter when a primary language is provided');
		});

		context('filtering based on contact with biological siblings', function() {
			it('should filter when checked');
		});

		context('filtering based on contact with biological parents', function() {
			it('should filter when checked');
		});

		context('filtering based on a video being required', function() {
			it('should filter when checked');
		});

		context('filtering based on legally free being required', function() {
			it('should filter when checked');
		});

		context('filtering based on updated within', function() {
			it('should filter when an updated within is provided');
		});

		context('filtering based on child needs', function() {
			it('should filter when physical needs are provided');
			it('should filter when emotional needs are provided');
			it('should filter when intellectual needs are provided');
		});

		context('filtering based on disabilities', function() {
			it('should filter when one disability is provided');
			it('should filter when multiple disabilities are provided');
		});

		context('filtering based on other considerations', function() {
			it('should filter when one other consideration is provided');
			it('should filter when multiple other considerations are provided');
		});

		context('filtering based on family constellations', function() {
			it('should filter when one family constellation is provided');
			it('should filter when multiple family constellations are provided');
		});

		context('filtering based on number of children in the home', function() {
			it('should filter when a number is provided');
		});

		context('filtering based on genders of children in the home', function() {
			it('should filter when one gender is provided');
			it('should filter when multiple genders are provided');
		});

		context('filtering based on child age', function() {
			it('should filter when only a minimum is provided');
			it('should filter when only a maximum is provided');
			it('should filter when the minimum is less than the maximum');
			it('should filter when the minimum and maximum are the same');
			it('should return an error when the maximum is less than the minimum');
		});

		context('filtering based on havePetsInHome', function() {
			it('should filter when checked');
		});

	});

	it('should provide a message when there are no results');

});