/* functions to fetch model information for use during the migration */

const Agency = keystone.list( 'Agency' );
const SocialWorker = keystone.list( 'Social Worker' );

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
}