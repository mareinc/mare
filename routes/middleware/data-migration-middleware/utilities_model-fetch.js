/* functions to fetch model information for use during the migration */

// TODO: for all these, you need to check string input, and if so, trim then check each for existence
const keystone			= require( 'keystone' ),
	  Source			= keystone.list( 'Source' ),
	  Agency			= keystone.list( 'Agency' ),
	  Family			= keystone.list( 'Family' ),
	  SocialWorker		= keystone.list( 'Social Worker' ),
	  CityOrTown		= keystone.list( 'City or Town' ),
	  Child				= keystone.list( 'Child' ),
	  MediaFeature		= keystone.list( 'Media Feature' ),
	  Event				= keystone.list( 'Event' ),
	  Admin				= keystone.list( 'Admin' ),
	  Inquiry			= keystone.list( 'Inquiry' ),
	  MailingList		= keystone.list( 'Mailing List' ),
	  OutsideContact	= keystone.list( 'Outside Contact' ),
	  Disruption		= keystone.list( 'Disruption' ),
	  Legalization		= keystone.list( 'Legalization' ),
	  Match				= keystone.list( 'Match' ),
	  Placement			= keystone.list( 'Placement' );

module.exports.getSourceById = id => {

	return new Promise( ( resolve, reject ) => {

		if( !id ) {
			console.error( `no id value passed in to getSourceById()` );

			return resolve();
		}

		Source.model
			.findOne()
			.where( 'oldId', id )
			.exec()
			.then( source => {
				// if no source was found
				if( !source ) {
					// reject the promise with details about the error
					reject( `no source matching oldId ${ id } could be found` );
				}
				// otherwise, accept the promise and pass back the retrieved source
				resolve( source );

			}, err => {

				reject( `error fetching source by oldId ${ id } - ${ err }` );
			});
	});
};

module.exports.getSourcesByIds = ids => {

	return new Promise( ( resolve, reject ) => {

		if( ids.length === 0 ) {
			return resolve();
		}

		Source.model
			.find()
			.where( 'oldId', { $in: ids } )
			.exec()
			.then( sources => {
				// if no source was found
				if( sources.length === 0 ) {
					// reject the promise with details about the error
					reject( `no sources matching oldIds ${ ids } could be found` );
				}
				// otherwise, accept the promise and pass back the retrieved source
				resolve( sources );

			}, err => {

				reject( `error fetching source by oldId ${ id } - ${ err }` );
			});
	});
};

module.exports.getAgencyById = agencyId => {

	return new Promise( ( resolve, reject ) => {
		// if no agency id was passed in
		if( !agencyId ) {
			// resolve the promise with an undefined value
			return resolve();
		}

		Agency.model.findOne()
			.where( 'oldId', agencyId )
			.populate( 'address.state' )
			.exec()
			.then( retrievedAgency => {
				// if no agency was found
				if( !retrievedAgency ) {
					reject( `error fetching agency by oldId ${ agencyId }`);
				}
				// otherwise, accept the promise and pass back the retrieved agency
				resolve( retrievedAgency );

			}, err => {
				reject( `error in getAgencyById() ${ err }` );
			});
	});
};

module.exports.getCityOrTownByName = ( cityOrTownName, state ) => {

	return new Promise( ( resolve, reject ) => {
		// if no registration number was passed in
		if( !cityOrTownName ) {
			console.log( `no city or town passed in to getCityOrTownbyName()` );
			// resolve the promise on the spot
			return resolve();
		}
		// if the user doesn't live in Massachusetts
		if( state !== 'MA' ) {
			// resolve the promise as there's no city or town information to fetch
			return resolve();
		}

		CityOrTown.model
			.findOne()
			.where( 'cityOrTown', cityOrTownName )
			.exec()
			.then( cityOrTown => {
				// if no child was found
				if( !cityOrTown ) {
					// log the issue
					console.error( `error fetching city or town by name ${ cityOrTownName }` );
					// and reject the promise with enough information to capture the error
					reject( cityOrTownName );
				}
				// otherwise, accept the promise and pass back the retrieved child
				resolve( cityOrTown );

			}, err => {

				console.error( `error in getCityOrTownByName() ${ err }` );
				reject();
			});
	});
};

module.exports.getSocialWorkerById = socialWorkerId => {

	return new Promise( ( resolve, reject ) => {
		// if no social worker id was passed in
		if( !socialWorkerId ) {
			// resolve the promise with an undefined value
			return resolve();
		}
	
		SocialWorker.model
			.findOne()
			.where( 'oldId', socialWorkerId )
			.exec()
			.then( retrievedSocialWorker => {
				// if no social worker was found
				if( !retrievedSocialWorker ) {
					// log the issue
					console.error( `error fetching social worker by oldId ${ socialWorkerId }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved social worker
				resolve( retrievedSocialWorker );
	
			}, err => {
	
				console.error( `error in getSocialWorkerById() ${ err }` );
				reject();
			});
	});

	
};

module.exports.getSocialWorkersByOldIds = oldIds => {
	
	return new Promise( ( resolve, reject ) => {

		if( oldIds.length === 0 ) {

			console.error( `no ids passed into getSocialWorkersByOldIds()` );

			return resolve();
		}

		SocialWorker.model
			.find()
			.where( { 'oldId': { $in: oldIds } } )
			.exec()
			.then( socialWorkers => {
				// if no social workers were found
				if( socialWorkers.length === 0 ) {
					// log the issue
					console.error( `error fetching social worker IDs by old ids ${ oldIds }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved social worker IDs
				resolve( socialWorkers );

			}, err => {

				console.error( `error in getSocialWorkerIdsByOldIds() ${ err }` );
				reject();
			});
		});
};

module.exports.getSocialWorkerIdsByOldIds = oldIds => {
	
	return new Promise( ( resolve, reject ) => {

		if( oldIds.length === 0 ) {

			console.error( `no ids passed into getSocialWorkerIdsByOldIds()` );

			return resolve();
		}

		SocialWorker.model
			.find()
			.where( { 'oldId': { $in: oldIds } } )
			.exec()
			.then( socialWorkers => {
				// if no social workers were found
				if( socialWorkers.length === 0 ) {
					// log the issue
					console.error( `error fetching social worker IDs by old ids ${ oldIds }` );
					// and resolve the promise with an undefined value
					resolve();
				}

				let socialWorkerIds = [];

				for( socialWorker of socialWorkers ) {
					socialWorkerIds.push( socialWorker._id );
				}
				// otherwise, accept the promise and pass back the retrieved social worker IDs
				resolve( socialWorkerIds );

			}, err => {

				console.error( `error in getSocialWorkerIdsByOldIds() ${ err }` );
				reject();
			});
		});
};

module.exports.getChildByRegistrationNumber = registrationNumber => {

	return new Promise( ( resolve, reject ) => {
		// if no registration number was passed in
		if( !registrationNumber ) {
			// resolve the promise on the spot
			return resolve();
		}

		Child.model
			.findOne()
			.where( 'registrationNumber', registrationNumber )
			.exec()
			.then( retrievedChild => {
				// if no child was found
				if( !retrievedChild ) {
					// log the issue
					console.error( `error fetching child by registration number ${ registrationNumber }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved child
				resolve( retrievedChild );

			}, err => {

				console.error( `error in getChildByRegistrationNumber() ${ err }` );
				reject();
			});
	});
};

module.exports.getChildIdsByRegistrationNumbers = registrationNumbers => {
	
	return new Promise( ( resolve, reject ) => {

		if( registrationNumbers.length === 0 ) {
			return resolve();
		}

		Child.model.find()
			.where( { 'registrationNumber': { $in: registrationNumbers } } )
			.exec()
			.then( children => {
				// if no children were found
				if( children.length === 0 ) {
					// log the issue
					console.error( `error fetching child IDs by registration numbers ${ registrationNumbers }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved child IDs
				resolve( children );

			}, err => {

				console.error( `error in getChildIdsByRegistrationNumbers() ${ err }` );
				reject();
			});
		});
};

module.exports.getMediaFeatureById = mediaFeatureId => {

	return new Promise( ( resolve, reject ) => {
		// if no media feature id was passed in
		if( !mediaFeatureId ) {
			// resolve the promise with an undefined value
			return resolve();
		}

		MediaFeature.model
			.findOne()
			.where( 'oldId', mediaFeatureId )
			.exec()
			.then( retrievedMediaFeature => {
				// if no media feature was found
				if( !retrievedMediaFeature ) {
					// log the issue
					console.error( `error fetching media feature by ID ${ mediaFeatureId }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved media feature
				resolve( retrievedMediaFeature );

			}, err => {

				console.error( `error in getMediaFeatureById() ${ err }` );
				reject();
			});
	});
};

module.exports.getFamilyByRegistrationNumber = registrationNumber => {

	return new Promise( ( resolve, reject ) => {

		if( !registrationNumber ) {
			return resolve();
		}

		Family.model
			.findOne()
			.where( 'registrationNumber', registrationNumber )
			.exec()
			.then( retrievedFamily => {
				// if no family was found
				if( !retrievedFamily ) {
					// log the issue
					console.error( `error fetching family by registrationNumber ${ registrationNumber }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved family
				resolve( retrievedFamily );

			}, err => {

				reject( `error in getFamilyByRegistrationNumber() - ${ err }` );
			});
	});
};

module.exports.getFamiliesByRegistrationNumbers = registrationNumbers => {
	
	return new Promise( ( resolve, reject ) => {
		
		if( registrationNumbers.length === 0 ) {
			return resolve();
		}

		Family.model
			.find()
			.where( { 'registrationNumber': { $in: registrationNumbers } } )
			.exec()
			.then( families => {
				// if no families were found
				if( families.length === 0 ) {
					// log the issue
					console.error( `error fetching families by registration numbers ${ registrationNumbers }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved family IDs
				resolve( families );

			}, err => {

				reject( `error in getFamilyIdsByRegistrationNumbers() - ${ err }` );
			});
	});
};

module.exports.getFamilyIdsByRegistrationNumbers = registrationNumbers => {
	
	return new Promise( ( resolve, reject ) => {
		
		if( registrationNumbers.length === 0 ) {
			return resolve();
		}

		Family.model.find()
			.where( { 'registrationNumber': { $in: registrationNumbers } } )
			.exec()
			.then( retrievedFamilies => {
				// if no families were found
				if( retrievedFamilies.length === 0 ) {
					// log the issue
					console.error( `error fetching family IDs by registration numbers ${ registrationNumbers }` );
					// and resolve the promise with an undefined value
					resolve();
				}

				let familyIds = [];

				for( family of retrievedFamilies ) {
					familyIds.push( family._id );
				}
				// otherwise, accept the promise and pass back the retrieved family IDs
				resolve( familyIds );

			}, err => {

				console.error( `error in getFamilyIdsByRegistrationNumbers() ${ err }` );
				reject();
			});
	});
};

module.exports.getEventById = ( resolve, reject, eventId ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	Event.model.findOne()
		.where( 'oldId', eventId )
		.exec()
		.then( retrievedEvent => {
			// if no event was found
			if( !retrievedEvent ) {
				// log the issue
				console.error( `error fetching event by oldId ${ eventId }` );
				// and reject the promise
				reject();
			}
			// otherwise, accept the promise and pass back the retrieved event
			resolve( retrievedEvent );

		}, err => {

			console.error( `error in getEventById() ${ err }` );
			reject();
		});
};

module.exports.getAdminById = id => {

	return new Promise( (resolve, reject ) => {		
		// if no admin id was passed in
		if( !id ) {
			// resolve the promise with an undefined value
			return resolve();
		}

		Admin.model
			.findOne()
			.where( 'oldId', id )
			.exec()
			.then( admin => {
				// if no admin was found
				if( !admin ) {
					reject( `error fetching admin by oldId ${ id }` );
				}
				// otherwise, accept the promise and pass back the retrieved admin
				resolve( admin );

			}, err => {

				reject( `error in getAdminById() ${ err }` );
			});
	});
};

module.exports.getInquiryById = id => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching inquiry by id ${ id }` );
		}

		Inquiry.model
			.findOne()
			.where( 'oldId', id )
			.exec()
			.then( inquiry => {
				// if no inquiry was found
				if( !inquiry ) {
					// and reject the promise
					reject( `error fetching inquiry by oldId ${ id }` );
				}
				// otherwise, accept the promise and pass back the retrieved inquiry
				resolve( inquiry );

			}, err => {

				reject( `error in getInquiryById() ${ err }` );
			});
	});
};

module.exports.getMailingListById = id => {

	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching mailing list by id ${ id }` );
		}

		MailingList.model
			.findById( id )
			.exec()
			.then( mailingList => {
				// if no mailing list was found
				if( !mailingList ) {
					// and reject the promise
					reject( `error fetching mailing list by oldId ${ id }` );
				}
				// otherwise, accept the promise and pass back the retrieved mailing list
				resolve( mailingList );

			}, err => {

				reject( `error in getMailingListById() ${ err }` );
			});
	});
};

module.exports.getOutsideContactsByOldIds = ids => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( ids.length === 0 ) {

			console.error( `no ids passed into getOutsideContactsByOldIds` );

			return resolve();
		}

		OutsideContact.model.find()
			.where( { 'oldId': { $in: ids } } )
			.exec()
			.then( outsideContacts => {
				// if no social workers were found
				if( outsideContacts.length === 0 ) {
					// log the issue
					console.error( `error fetching outside contacts by old ids ${ ids }` );
					// and resolve the promise with an undefined value
					resolve();
				}
				// otherwise, accept the promise and pass back the retrieved social worker IDs
				resolve( outsideContacts );

			}, err => {

				reject( `error in getSocialWorkerIdsByOldIds() ${ err }` );
			});
		});
};

module.exports.getDisruptionsByChildId = id => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching disruptions - no child id provided` );
		}

		Disruption.model
			.find()
			.where( 'child', id )
			.exec()
			.then( disruptions => {
				// otherwise, accept the promise and pass back the retrieved disruptions
				resolve( disruptions );

			}, err => {

				reject( `error in getDisruptionsByChildId() - ${ err }` );
			});
	});
};

module.exports.getLegalizationsByChildId = id => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching legalizations - no child id provided` );
		}

		Legalization.model
			.find()
			.where( 'child', id )
			.exec()
			.then( legalizations => {
				// otherwise, accept the promise and pass back the retrieved legalizations
				resolve( legalizations );

			}, err => {

				reject( `error in getLegalizationsByChildId() - ${ err }` );
			});
	});
};

module.exports.getMatchesByChildId = id => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching matches - no child id provided` );
		}

		Match.model
			.find()
			.where( 'child', id )
			.exec()
			.then( matches => {
				// otherwise, accept the promise and pass back the retrieved matches
				resolve( matches );

			}, err => {

				reject( `error in getMatchesByChildId() - ${ err }` );
			});
	});
};

module.exports.getPlacementsByChildId = id => {
	
	return new Promise( ( resolve, reject ) => {
	
		if( !id ) {
			return reject( `error fetching placements - no child id provided` );
		}

		Placement.model
			.find()
			.where( 'child', id )
			.exec()
			.then( placements => {
				// otherwise, accept the promise and pass back the retrieved placements
				resolve( placements );

			}, err => {

				reject( `error in getPlacementsByChildId() - ${ err }` );
			});
	});
};