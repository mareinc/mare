const keystone								= require( 'keystone' );
const _										= require( 'underscore' );
const Region 								= keystone.list( 'Region' );
const Position								= keystone.list( 'Social Worker Position' );
const Race									= keystone.list( 'Race' );
const State									= keystone.list( 'State' );
const Gender								= keystone.list( 'Gender' );
const LegalStatus							= keystone.list( 'Legal Status' );
const Language								= keystone.list( 'Language' );
const FamilyConstellation					= keystone.list( 'Family Constellation' );
const Disability							= keystone.list( 'Disability' );
const OtherConsideration					= keystone.list( 'Other Consideration' );
const OtherFamilyConstellationConsideration	= keystone.list( 'Other Family Constellation Consideration' );
const ChildStatus							= keystone.list( 'Child Status' );
const ChildType								= keystone.list( 'Child Type' );
const CityOrTown							= keystone.list( 'City or Town' );
const EventType								= keystone.list( 'Event Type' );
const Residence								= keystone.list( 'Residence' );
const WayToHearAboutMARE					= keystone.list( 'Way To Hear About MARE' );

exports.getAllRegions = ( req, res, done ) => {
	
	let locals = res.locals;

	Region.model.find()
				.exec()
				.then( regions => {

					locals.regions = regions;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllSocialWorkerPositions = ( req, res, done ) => {
	
	let locals = res.locals;

	Position.model.find()
				.exec()
				.then( positions => {

					locals.positions = positions;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllRaces = ( req, res, done, options ) => {
	
	let locals = res.locals;

	Race.model.find()
				.exec()
				.then( races => {
					// If there is a value of 'other' in the list, which should appear at the bottom of any
					// dropdown lists on the site, add an appropriate attribute
					if( options && options.other ) {

						for( let race of races ) {
							if( race.race === 'other' ) {
								race.other = true;
							}
						};

					}

					locals.races = races;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllStates = ( req, res, done, options ) => {
	
	let locals = res.locals;

	State.model.find()
				.exec()
				.then( states => {
					// If there is a default value which should appear selected when a dropdown menu is first rendered add an appropriate attribute
					if( options && options.default ) {

						for( let state of states ) {
							if(state.state === options.default) {
								state.defaultSelection = true;
							}
						};

					}

					locals.states = states;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllGenders = ( req, res, done ) => {
	
	let locals = res.locals;

	Gender.model.find()
				.exec()
				.then( genders => {

					locals.genders = genders;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllLegalStatuses = ( req, res, done ) => {
	
	let locals = res.locals;

	LegalStatus.model.find()
				.exec()
				.then( legalStatuses => {

					locals.legalStatuses = legalStatuses;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllLanguages = ( req, res, done ) => {
	
	let locals = res.locals;

	Language.model.find()
				.exec()
				.then( languages => {

					locals.languages = languages;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllFamilyConstellations = ( req, res, done ) => {
	
	let locals = res.locals;

	FamilyConstellation.model.find()
				.exec()
				.then( familyConstellations => {

					locals.familyConstellations = familyConstellations;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllDisabilities = ( req, res, done ) => {
	
	let locals = res.locals;

	Disability.model.find()
				.exec()
				.then( disabilities => {

					locals.disabilities = disabilities;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllOtherConsiderations = ( req, res, done ) => {
	
	let locals = res.locals;

	OtherConsideration.model.find()
				.exec()
				.then( otherConsiderations => {

					locals.otherConsiderations = otherConsiderations;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getChildTypesForWebsite = ( req, res, done ) => {
	
	let locals = res.locals;

	ChildType.model.find()
				.where('availableOnWebsite', true)
				.exec()
				.then( childTypes => {

					locals.childTypes = childTypes;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getEventTypesForWebsite = ( req, res, done ) => {
	
	let locals = res.locals;

	EventType.model.find()
				.where( 'availableOnWebsite', true )
				.exec()
				.then( eventTypes => {

					locals.eventTypes = eventTypes;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
}

exports.getAllWaysToHearAboutMARE = ( req, res, done, options ) => {
	
	let locals = res.locals;

	WayToHearAboutMARE.model.find()
				.exec()
				.then( waysToHearAboutMARE => {
					// If there is a value of 'other' in the list, which should appear at the bottom of any
					// dropdown lists on the site, add an appropriate attribute
					if( options && options.other ) {

						for( let wayToHearAboutMARE of waysToHearAboutMARE ) {
							if( wayToHearAboutMARE.wayToHearAboutMARE === 'other' ) {
								wayToHearAboutMARE.other = true;
							}
						};

					}

					locals.waysToHearAboutMARE = waysToHearAboutMARE;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllResidences = ( req, res, done ) => {

	let locals = res.locals;

	Residence.model.find()
				.exec()
				.then( residences => {

					locals.residences = residences;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllOtherFamilyConstellationConsiderations = ( req, res, done ) => {

	let locals = res.locals;

	OtherFamilyConstellationConsideration.model.find()
				.exec()
				.then( otherFamilyConstellationConsiderations => {

					locals.otherFamilyConstellationConsiderations = otherFamilyConstellationConsiderations;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getAllCitiesAndTowns = ( req, res, done ) => {
	
	let locals = res.locals;

	CityOrTown.model.find()
				.exec()
				.then( citiesAndTowns => {

					locals.citiesAndTowns = citiesAndTowns;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
};

exports.getChildStatusIdByName = ( req, res, done, name ) => {
	let locals = res.locals;

	ChildStatus.model.findOne()
				.where( 'childStatus' ).equals( name )
				.lean()
				.exec()
				.then( status => {

					locals.activeChildStatusId = status._id;
					// execute done function if async is used to continue the flow of execution
					done()

				}, err => {

					console.log( err );
					done();

				});
 };