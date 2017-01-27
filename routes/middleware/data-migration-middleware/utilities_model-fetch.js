/* functions to fetch model information for use during the migration */

const Source		= keystone.list( 'Source' );
const Agency		= keystone.list( 'Agency' );
const Family		= keystone.list( 'Family' );
const SocialWorker	= keystone.list( 'Social Worker' );
const Child			= keystone.list( 'Child' );
const MediaFeature	= keystone.list( 'Media Feature' );

module.exports.getSourceById = ( resolve, reject, sourceId ) => {

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

module.exports.getAgencyById = ( resolve, reject, agencyId ) => {

	Agency.model.findOne()
		.where( 'oldId', agencyId )
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
};

module.exports.getSocialWorkerById = ( resolve, reject, socialWorkerId ) => {

	SocialWorker.model.findOne()
		.where( 'oldId', socialWorkerId )
		.exec()
		.then( retrievedSocialWorker => {
			// if no social worker was found
			if( !retrievedSocialWorker ) {
				// log the issue
				console.error( `error fetching social worker by oldId ${ socialWorkerId }` );
				// and resolve the promise with an undefined value
				resolve( undefined );
			}
			// otherwise, accept the promise and pass back the retrieved social worker
			resolve( retrievedSocialWorker );

		}, err => {

			console.error( `error in getSocialWorkerById() ${ err }` );
			reject();
		});
};

module.exports.getChildByRegistrationNumber = ( resolve, reject, registrationNumber ) => {

	Child.model.findOne()
		.where( 'registrationNumber', registrationNumber )
		.exec()
		.then( retrievedChild => {
			// if no child was found
			if( !retrievedChild ) {
				// log the issue
				console.error( `error fetching child by registration number ${ registrationNumber }` );
				// and resolve the promise with an undefined value
				resolve( undefined );
			}
			// otherwise, accept the promise and pass back the retrieved child
			resolve( retrievedChild );

		}, err => {

			console.error( `error in getChildByRegistrationNumber() ${ err }` );
			reject();
		});
};

module.exports.getChildIdsByRegistrationNumbers = ( resolve, reject, registrationNumbers ) => {

	Child.model.find()
		.where( { 'registrationNumber': { $in: registrationNumbers } } )
		.exec()
		.then( retrievedChildren => {
			// if no children were found
			if( retrievedChildren.length === 0 ) {
				// log the issue
				console.error( `error fetching child IDs by registration numbers ${ registrationNumbers }` );
				// and resolve the promise with an undefined value
				resolve( undefined );
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

module.exports.getMediaFeatureById = ( resolve, reject, mediaFeatureId ) => {

	MediaFeature.model.findOne()
		.where( 'oldId', mediaFeatureId )
		.exec()
		.then( retrievedMediaFeature => {
			// if no media feature was found
			if( !retrievedMediaFeature ) {
				// log the issue
				console.error( `error fetching media feature by ID ${ mediaFeatureId }` );
				// and resolve the promise with an undefined value
				resolve( undefined );
			}
			// otherwise, accept the promise and pass back the retrieved media feature
			resolve( retrievedMediaFeature );

		}, err => {

			console.error( `error in getMediaFeatureById() ${ err }` );
			reject();
		});
};

module.exports.getFamilyById = ( resolve, reject, familyId ) => {

	Family.model.findOne()
		.where( 'registrationNumber', familyId )
		.exec()
		.then( retrievedFamily => {
			// if no family was found
			if( !retrievedFamily ) {
				// log the issue
				console.error( `error fetching family by registrationNumber ${ familyId }` );
				// and resolve the promise with an undefined value
				resolve( undefined );
			}
			// otherwise, accept the promise and pass back the retrieved family
			resolve( retrievedFamily );

		}, err => {

			console.error( `error in getFamilyById() ${ err }` );
			reject();
		});
};