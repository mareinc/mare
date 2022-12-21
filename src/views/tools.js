const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  listService	= require( '../components/lists/list.controllers' ),
	  utilsService	= require( '../components/reporting dashboard/utils.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals;
	
	let fetchChildStatuses 			= listService.getAllChildStatuses(),
		fetchFamilyStatuses			= listService.getAllFamilyStatuses(),
		fetchGenders 				= listService.getAllGenders(),
		fetchRaces 					= listService.getAllRaces(),
		fetchLegalStatuses 			= listService.getAllLegalStatuses(),
		fetchFamilyConstellations 	= listService.getAllFamilyConstellations(),
		fetchInquiryMethods 		= listService.getAllInquiryMethods(),
		fetchRegions 				= listService.getAllRegions(),
		fetchResidences 			= listService.getAllResidences(),
		fetchStates					= listService.getAllStates(),
		fetchMatchingExclusions		= listService.getAllMatchingExclusions();

	const fetchFamilies = keystone.list( 'Family' ).model
		.find({ isActive: true })
		.populate([
			'address.city',
			'address.region',
			'address.state'
		].join( ' ' ))
		.lean()
		.exec();

	Promise.all( [ fetchChildStatuses, fetchFamilyStatuses, fetchGenders, fetchRaces, fetchLegalStatuses, fetchFamilyConstellations, fetchInquiryMethods, fetchRegions, fetchResidences, fetchStates, fetchMatchingExclusions, fetchFamilies ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ childStatuses, familyStatuses, genders, races, legalStatuses, familyConstellations, inquiryMethods, regions, residences, states, matchingExclusions, families ] = values;

			// create a list of families for excel export
			locals.families = families.reduce( ( _families, family ) => {

				// extract family address data
				const address = {
					street: family.address.street1 + family.address.street2,
					city: family.address.displayCity,
					state: family.address.state && family.address.state.state,
					zip: family.address.zipCode,
					region: family.address.region && family.address.region.region
				};

				// create record URL string
				const recordURL = `https://mareinc.org/keystone/families/${family._id.toString()}`;

				// extract registration number
				const registrationNumber = family.registrationNumber;

				// extract contact 1 data
				const contact1 = {
					firstName: family.contact1.name.first,
					lastName: family.contact1.name.last,
					phone: family.homePhone,
					email: family.email
				};

				// filter out missing/invalid dates
				if ( !family.contact1.birthDate || !moment.utc( family.contact1.birthDate ).isValid() ) {

					// console.log(`invalid birth date for Contact 1 of family: ${family.displayNameAndRegistration}`);
					// console.log(family.contact1.birthDate);
					contact1.birthDate = undefined;

				} else {

					// convert dates to proper format, then add a time zone offset
					// this is necessary because the excel plugin uses the browser offset when converting an HTML table to a spreadhseet, which was 
					// converting dates to the previous day
					contact1.birthDate = moment.utc( family.contact1.birthDate ).format( 'YYYY-MM-DD' );
					contact1.birthDate = contact1.birthDate + 'T06:00:00.000Z';
				}

				// compose family member 1 data
				const familyMember1 = {
					address,
					contact: contact1,
					recordURL,
					registrationNumber
				};
				// add family member 1 data to families collection
				_families.push( familyMember1 );

				// extract contact 2 data (if it exists)
				const contact2 = {};
				if ( family.contact2.email ) {
					
					contact2.firstName = family.contact2.name.first;
					contact2.lastName = family.contact2.name.last;
					contact2.phone = family.contact2.phone && family.contact2.phone.mobile;
					contact2.email = family.contact2.email;

					// filter out missing/invalid dates
					if ( !family.contact2.birthDate || !moment.utc( family.contact2.birthDate ).isValid() ) {
						
						// console.log(`invalid birth date for Contact 2 of family: ${family.displayNameAndRegistration}`);
						// console.log(family.contact2.birthDate);
						contact2.birthDate = undefined;

					} else {

						// convert dates to proper format, then add a time zone offset
						// this is necessary because the excel plugin uses the browser offset when converting an HTML table to a spreadhseet, which was 
						// converting dates to the previous day
						contact2.birthDate = moment.utc( family.contact2.birthDate ).format( 'YYYY-MM-DD' );
						contact2.birthDate = contact2.birthDate + 'T06:00:00.000Z';
					}

					// compose family member 2 data
					const familyMember2 = {
						address,
						contact: contact2,
						recordURL,
						registrationNumber
					};
					// add family member 2 data to families collection
					_families.push( familyMember2 );
				}

				return _families;
			}, []);
			
			// assign properties to locals for access during templating
			locals.childStatuses = childStatuses;
			locals.familyStatuses = familyStatuses;
			locals.genders = genders;
			locals.races = races;
			locals.legalStatuses = legalStatuses;
			locals.familyConstellations = familyConstellations;
			locals.ages = Array( 21 ).fill().map( ( _, i ) => i );
			locals.siblingGroupSizes = Array.from( { length: 10 }, ( value, index ) => ++index );
			locals.physicalNeeds = utilsService.PHYSICAL_NEEDS_OPTIONS;
			locals.intellectualNeeds = utilsService.INTELLECTUAL_NEEDS_OPTIONS;
			locals.emotionalNeeds = utilsService.EMOTIONAL_NEEDS_OPTIONS;
			locals.socialNeeds = utilsService.SOCIAL_NEEDS_OPTIONS;
			locals.inquirers = utilsService.INQUIRER_OPTIONS;
			locals.inquiryTypes = utilsService.INQUIRY_TYPES;
			locals.placementTypes = utilsService.PLACEMENT_TYPES.map( placementType => placementType.modelName );
			locals.inquiryMethods = inquiryMethods;
			locals.regions = regions;
			locals.residences = residences;
			locals.states = states;
			locals.familyStages = utilsService.FAMILY_STAGES;
			locals.familyServices = utilsService.FAMILY_SERVICES;
			locals.familyLGBTQIdentityOptions = utilsService.FAMILY_LGBTQ_IDENTITY_OPTIONS;
            locals.lgbtqIdentityOptions = utilsService.LGBTQ_IDENTITY_OPTIONS;
			locals.relationshipStatusOptions = utilsService.RELATIONSHIP_STATUS_OPTIONS;
			locals.matchingExclusions = matchingExclusions.filter( matchingExclusion => ![ process.env.MATCHING_EXCLUSION_OLDER_CHILDREN, process.env.MATCHING_EXCLUSION_YOUNGER_CHILDREN ].includes( matchingExclusion._id.toString() ) ); // don't include Younger/Older children options
			// create default ranges to seed date range fields
			locals.defaultDateRanges = {
				month: {
					fromDate: moment().subtract( 30, "days" ).format( 'YYYY-MM-DD' ),
					toDate: moment().format( 'YYYY-MM-DD' )
				},
				year: {
					fromDate: moment().subtract( 1, "years" ).format( 'YYYY-MM-DD' ),
					toDate: moment().format( 'YYYY-MM-DD' )
				}
			};
			// generate the date ranges of the previous three fiscal years to support pre-filling search dates by fiscal year
			// on the inquiry report search form
			const PREVIOUS_YEARS = 3;
			const CURRENT_YEAR = moment.utc().year();
			const IS_PAST_FISCAL_YEAR_END = moment.utc().dayOfYear() > moment.utc('06/30', 'MM/DD').dayOfYear();
			let fiscalYears = [];
			for ( let i = 0; i < PREVIOUS_YEARS; i++ ) {
				fiscalYears.push({
					startDate: moment.utc(`07/01/${CURRENT_YEAR - (IS_PAST_FISCAL_YEAR_END ? i + 1 : i + 2)}`, 'MM/DD/YYYY').format( 'YYYY-MM-DD' ),
					endDate: moment.utc(`06/30/${CURRENT_YEAR - (IS_PAST_FISCAL_YEAR_END ? i : i + 1)}`, 'MM/DD/YYYY').format( 'YYYY-MM-DD' ),
					fiscalYear: moment.utc().year() - (IS_PAST_FISCAL_YEAR_END ? i : i + 1)
				});
			}
			locals.fiscalYears = fiscalYears.reverse();

			// render the view using the tools.hbs template
			view.render( 'tools', { layout: 'tools' } );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the tools page`, err );
			// render the view using the tools.hbs template
			view.render( 'tools', { layout: 'tools' } );
		});
};
