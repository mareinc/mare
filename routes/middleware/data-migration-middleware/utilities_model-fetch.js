/* functions to fetch model information for use during the migration */

// TODO: for all these, you need to check string input, and if so, trim then check each for existence
const keystone		= require( 'keystone' ),
	  Source		= keystone.list( 'Source' ),
	  Agency		= keystone.list( 'Agency' ),
	  Family		= keystone.list( 'Family' ),
	  SocialWorker	= keystone.list( 'Social Worker' ),
	  CityOrTown	= keystone.list( 'City or Town' ),
	  Child			= keystone.list( 'Child' ),
	  MediaFeature	= keystone.list( 'Media Feature' ),
	  Event			= keystone.list( 'Event' ),
	  Admin			= keystone.list( 'Admin' ),
	  Inquiry		= keystone.list( 'Inquiry' );

module.exports.getSourceById = ( resolve, reject, sourceId ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	Source.model.findOne()
		.where( 'oldId', sourceId )
		.exec()
		.then( retrievedSource => {
			// if no source was found
			if( !retrievedSource ) {
				// log the issue
				console.error( `error fetching source by oldId ${ sourceId }` );
				// and reject the promise
				reject();
			}
			// otherwise, accept the promise and pass back the retrieved source
			resolve( retrievedSource );

		}, err => {

			console.error( `error in getSourceById() ${ err }` );
			reject();
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
					// log the issue
					console.error( `error fetching agency by oldId ${ agencyId }` );
					// and reject the promise
					reject();
				}
				// otherwise, accept the promise and pass back the retrieved agency
				resolve( retrievedAgency );

			}, err => {

				console.error( `error in getAgencyById() ${ err }` );
				reject();
			});
	});
};

module.exports.getAgencyIdsByOldIds = ( resolve, reject, oldIds ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	Agency.model.find()
		.where( { 'oldId': { $in: oldIds } } )
		.exec()
		.then( retrievedAgencies => {
			// if no agencies were found
			if( retrievedAgencies.length === 0 ) {
				// log the issue
				console.error( `error fetching agency IDs by old ids ${ oldIds }` );
				// and resolve the promise with an undefined value
				resolve();
			}

			let agencyIds = [];

			for( agency of retrievedAgencies ) {
				agencyIds.push( agency._id );
			}
			// otherwise, accept the promise and pass back the retrieved agency IDs
			resolve( agencyIds );

		}, err => {

			console.error( `error in getAgencyIdsByOldIds() ${ err }` );
			reject();
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

module.exports.getSocialWorkerIdsByOldIds = ( resolve, reject, oldIds ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	SocialWorker.model.find()
		.where( { 'oldId': { $in: oldIds } } )
		.exec()
		.then( retrievedSocialWorkers => {
			// if no social workers were found
			if( retrievedSocialWorkers.length === 0 ) {
				// log the issue
				console.error( `error fetching social worker IDs by old ids ${ oldIds }` );
				// and resolve the promise with an undefined value
				resolve();
			}

			let socialWorkerIds = [];

			for( socialWorker of retrievedSocialWorkers ) {
				socialWorkerIds.push( socialWorker._id );
			}
			// otherwise, accept the promise and pass back the retrieved social worker IDs
			resolve( socialWorkerIds );

		}, err => {

			console.error( `error in getSocialWorkerIdsByOldIds() ${ err }` );
			reject();
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

module.exports.getChildIdsByRegistrationNumbers = ( resolve, reject, registrationNumbers ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	Child.model.find()
		.where( { 'registrationNumber': { $in: registrationNumbers } } )
		.exec()
		.then( retrievedChildren => {
			// if no children were found
			if( retrievedChildren.length === 0 ) {
				// log the issue
				console.error( `error fetching child IDs by registration numbers ${ registrationNumbers }` );
				// and resolve the promise with an undefined value
				resolve();
			}

			let childIds = [];

			for( child of retrievedChildren ) {
				childIds.push( child._id );
			}
			// otherwise, accept the promise and pass back the retrieved child IDs
			resolve( childIds );

		}, err => {

			console.error( `error in getChildIdsByRegistrationNumbers() ${ err }` );
			reject();
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

				console.error( `error in getFamilyByRegistrationNumber() ${ err }` );
				reject();
			});
	});
};

module.exports.getFamilyIdsByRegistrationNumbers = ( resolve, reject, registrationNumbers ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
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

module.exports.getAdminById = ( resolve, reject, adminId ) => {

	return new Promise( (resolve, reject ) => {
		/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
		Admin.model
			.findOne()
			.where( 'oldId', adminId )
			.exec()
			.then( retrievedAdmin => {
				// if no admin was found
				if( !retrievedAdmin ) {
					// log the issue
					console.error( `error fetching admin by oldId ${ adminId }` );
					// and reject the promise
					reject();
				}
				// otherwise, accept the promise and pass back the retrieved admin
				resolve( retrievedAdmin );

			}, err => {

				console.error( `error in getAdminById() ${ err }` );
				reject();
			});
	});
};

module.exports.getInquiryById = ( resolve, reject, inquiryId ) => {
	/* TODO: short circuit the fetch here by just resolving if there are no oldIds */
	Inquiry.model.findOne()
		.where( 'oldId', inquiryId )
		.exec()
		.then( retrievedInquiry => {
			// if no inquiry was found
			if( !retrievedInquiry ) {
				// log the issue
				console.error( `error fetching inquiry by oldId ${ inquiryId }` );
				// and reject the promise
				reject();
			}
			// otherwise, accept the promise and pass back the retrieved inquiry
			resolve( retrievedInquiry );

		}, err => {

			console.error( `error in getInquiryById() ${ err }` );
			reject();
		});
};