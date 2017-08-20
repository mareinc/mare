const keystone								= require( 'keystone' ),
	  _										= require( 'underscore' ),
	  CityOrTown							= keystone.list( 'City or Town' ),
	  ChildStatus							= keystone.list( 'Child Status' ),
	  ChildType								= keystone.list( 'Child Type' ),
	  Disability							= keystone.list( 'Disability' ),
	  EventType								= keystone.list( 'Event Type' ),
	  FamilyConstellation					= keystone.list( 'Family Constellation' ),
	  Gender								= keystone.list( 'Gender' ),
	  InquiryMethod							= keystone.list( 'Inquiry Method' ),
	  LegalStatus							= keystone.list( 'Legal Status' ),
	  Language								= keystone.list( 'Language' ),
	  OtherConsideration					= keystone.list( 'Other Consideration' ),
	  OtherFamilyConstellationConsideration	= keystone.list( 'Other Family Constellation Consideration' ),
	  Position								= keystone.list( 'Social Worker Position' ),
	  Race									= keystone.list( 'Race' ),
	  Region 								= keystone.list( 'Region' ),
	  Residence								= keystone.list( 'Residence' ),
	  Source								= keystone.list( 'Source' ),
	  State									= keystone.list( 'State' ),
	  WayToHearAboutMARE					= keystone.list( 'Way To Hear About MARE' );

exports.getAllRegions = () => {

	return new Promise( ( resolve, reject ) => {
		// query the database for all region models
		Region.model
			.find()
			.exec()
			.then( regions => {
				// if no regions could not be found
				if( regions.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no regions could be found` );
					// reject the promise
					return reject();
				}
				// if regions were successfully returned, resolve with the array	
				resolve( regions );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all regions - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllSocialWorkerPositions = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all social worker position models
		Position.model
			.find()
			.exec()
			.then( positions => {
				// if no social worker positions could not be found
				if( positions.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no social worker positions could be found` );
					// reject the promise
					return reject();
				}
				// if positions were successfully returned, resolve with the array
				resolve( positions );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging putposes
				console.error( `error fetching the list of all social worker positions - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllRaces = options => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all race models
		Race.model
			.find()
			.exec()
			.then( races => {
				// if no races could not be found
				if( races.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no races could be found` );
					// reject the promise
					return reject();
				}
				// if there is a value of 'other' in the list, which should appear at the bottom of any
				// dropdown lists on the site, add an appropriate attribute
				if( options && options.other ) {
					// loop through the returned races array
					for( let race of races ) {
						// and if a value of 'other' is encountered
						if( race.race === 'other' ) {
							// add an attribute to the model object showing that it represents the 'other' value
							race.other = true;
						}
					};
				}
				// resolve with the returned array of races
				resolve( races );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of races - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllStates = options => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all states models
		State.model
			.find()
			.exec()
			.then( states => {
				// if no states could not be found
				if( states.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no states could be found` );
					// reject the promise
					return reject();
				}
				// if there is a default value which should appear selected when a dropdown menu is first rendered add an appropriate attribute
				if( options && options.default ) {
					// loop through the returned states array
					for( let state of states ) {
						// and if one matches the text of the default option
						if( state.state === options.default ) {
							// add an attribute to the model object showing that it represents the default option
							state.defaultSelection = true;
						}
					};

				}
				// resolve with the returned array of states
				resolve( states );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all states - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllGenders = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all gender models
		Gender.model
			.find()
			.exec()
			.then( genders => {
				// if no genders could not be found
				if( genders.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no genders could be found` );
					// reject the promise
					return reject();
				}
				// if genders were successfully returned, resolve with the array
				resolve( genders );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all genders - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllLegalStatuses = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all legal status models
		LegalStatus.model
			.find()
			.exec()
			.then( legalStatuses => {
				// if no legal statuses could not be found
				if( legalStatuses.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no legal statuses could be found` );
					// reject the promise
					return reject();
				}
				// if legal statuses were successfully returned, resolve with the array
				resolve( legalStatuses );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all legal statuses - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllLanguages = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all language models
		Language.model
			.find()
			.exec()
			.then( languages => {
				// if no languages could not be found
				if( languages.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no languages could be found` );
					// reject the promise
					return reject();
				}
				// if languages were successfully returned, resolve with the array
				resolve( languages );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all languages - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllFamilyConstellations = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all family constellation models
		FamilyConstellation.model
			.find()
			.exec()
			.then( familyConstellations => {
				// if no family constellations could not be found
				if( familyConstellations.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no family constellations could be found` );
					// reject the promise
					return reject();
				}
				// if family constellations were successfully returned, resolve with the array
				resolve( familyConstellations );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all family constellations - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllDisabilities = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all disability models
		Disability.model
			.find()
			.exec()
			.then( disabilities => {
				// if no disabilities could not be found
				if( disabilities.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no disabilities could be found` );
					// reject the promise
					return reject();
				}
				// if disabilities were successfully returned, resolve with the array
				resolve( disabilities );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all disabilities - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllOtherConsiderations = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all other consideration models
		OtherConsideration.model
			.find()
			.exec()
			.then( otherConsiderations => {
				// if no other considerations could not be found
				if( otherConsiderations.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no other considerations could be found` );
					// reject the promise
					return reject();
				}
				// if other considerations were successfully returned, resolve with the array
				resolve( otherConsiderations );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all other considerations - ${ err }` );
				// reject the promise
				reject();

			});
	});
};

exports.getChildTypesForWebsite = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all child types marked for display on the website
		ChildType.model
			.find()
			.where( 'availableOnWebsite', true )
			.exec()
			.then( childTypes => {
				// if no child types could not be found
				if( childTypes.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no child types could be found` );
					// reject the promise
					return reject();
				}
				// if child types were successfully returned, resolve with the array
				resolve( childTypes );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all child types meant for website display - ${ err }` );
				// reject the promise
				reject();

			});
	});
};

exports.getEventTypesForWebsite = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all event types marked for display on the website
		EventType.model
			.find()
			.where( 'availableOnWebsite', true )
			.exec()
			.then( eventTypes => {
				// if no event types meant for the website could not be found
				if( eventTypes.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no event types meant for website display could be found` );
					// reject the promise
					return reject();
				}
				// if event types were successfully returned, resolve with the array
				resolve( eventTypes );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of all event types meant for website display - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllWaysToHearAboutMARE = options => {
	
	return new Promise( ( resolve, reject ) => {
	// query the database for all ways to hear about MARE
	WayToHearAboutMARE.model
		.find()
		.exec()
		.then( waysToHearAboutMARE => {
			// if no ways to hear about MARE could not be found
			if( waysToHearAboutMARE.length === 0 ) {
				// log an error for debugging purposes
				console.error( `no ways to hear about MARE could be found` );
				// reject the promise
				return reject();
			}
			// if there is a value of 'other' in the list, which should appear at the bottom of any
			// dropdown lists on the site, add an appropriate attribute
			if( options && options.other ) {
				// loop through the returned ways to hear about MARE array
				for( let wayToHearAboutMARE of waysToHearAboutMARE ) {
					// and if a value of 'other' is encountered
					if( wayToHearAboutMARE.wayToHearAboutMARE === 'other' ) {
						// add an attribute to the model object showing that it represents the 'other' value
						wayToHearAboutMARE.other = true;
					}
				};
			}
			// resolve with the returned array of ways to hear about MARE
			resolve( waysToHearAboutMARE );
		// if an error was encountered fetching from the database
		}, err => {
			// log the error for debugging purposes
			console.error( `error fetching the list of ways to hear about MARE - ${ err }` );
			// reject the promise
			reject();
		});
	});
};

exports.getAllResidences = () => {

	return new Promise( ( resolve, reject ) => {
		// query the database for all residences
		Residence.model
			.find()
			.exec()
			.then( residences => {
				// if no residences could not be found
				if( residences.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no residences could be found` );
					// reject the promise
					return reject();
				}
				// if residences were successfully returned, resolve with the array
				resolve( residences );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of residences - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllOtherFamilyConstellationConsiderations = () => {

	return new Promise( ( resolve, reject ) => {
		// query the database for all other family constellation considerations
		OtherFamilyConstellationConsideration.model
			.find()
			.exec()
			.then( otherFamilyConstellationConsiderations => {
				// if no other family constellation considerations could not be found
				if( otherFamilyConstellationConsiderations.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no other family constellation considerations could be found` );
					// reject the promise
					return reject();
				}
				// if other family constellation considerations were successfully returned, resolve with the array
				resolve( otherFamilyConstellationConsiderations );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of other family constellation considerations - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getAllCitiesAndTowns = () => {
	
	return new Promise( ( resolve, reject ) => {
		// query the database for all cities and towns
		CityOrTown.model
			.find()
			.sort( { cityOrTown: 1 } )
			.exec()
			.then( citiesAndTowns => {
				// if no cities or towns could not be found
				if( citiesAndTowns.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no cities or towns could be found` );
					// reject the promise
					return reject();
				}
				// if cities and towns were successfully returned, resolve with the array
				resolve( citiesAndTowns );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the list of cities and towns - ${ err }` );
				// reject the promise
				reject();
			});
	});
};
// TODO: this needs to be un-async'ed
exports.getChildStatusIdByName = ( req, res, done, name ) => {

	let locals = res.locals;

	ChildStatus.model
		.findOne()
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

exports.getInquiryMethodByName = name => {

	return new Promise( ( resolve, reject ) => {
		// attempt to find a single inquiry method matching the passed in name
		InquiryMethod.model
			.findOne()
			.where( 'inquiryMethod' ).equals( name )
			.exec()
			.then( inquiryMethod => {
				// if the target inquiry method could not be found
				if( !inquiryMethod ) {
					// log an error for debugging purposes
					console.error( `no inquiry method matching '${ name } could be found` );
					// reject the promise
					return reject();
				}
				// if the target inquiry method was found, resolve the promise with the lean version of the object
				resolve( inquiryMethod );
			// if there was an error fetching from the database
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching inquiry method matching ${ name } - ${ err }` );
				// and reject the promise
				reject();
			});
	});
};

exports.getSourceByName = name => {
	
		return new Promise( ( resolve, reject ) => {
			// attempt to find a single source matching the passed in name
			Source.model
				.findOne()
				.where( 'source' ).equals( name )
				.exec()
				.then( source => {
					// if the target source could not be found
					if( !source ) {
						// log an error for debugging purposes
						console.error( `no source matching name '${ name } could be found` );
						// reject the promise
						return reject();
					}
					// if the target source was found, resolve the promise with the lean version of the object
					resolve( source );
				// if there was an error fetching from the database
				}, err => {
					// log an error for debugging purposes
					console.error( `error fetching source matching ${ name } - ${ err }` );
					// and reject the promise
					reject();
				});
		});
	};