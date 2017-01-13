/* functions to fetch model information for use during the migration */

const Agency = keystone.list( 'Agency' );

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

            console.error( `error in getModelId() ${ err }` );
			done();
        });
}