const keystone = require( 'keystone' );

exports.getContactByRegion = ( { region, fieldsToPopulate } ) => {

    return new Promise( ( resolve, reject ) => {
        // if no region id was passed in
        if( !region ) {
            // reject the promise with details of the error
            return reject( new Error( `no region provided` ) );
        }

        keystone.list( 'CSC Region Contact' ).model
            .findOne()
            .select( 'cscRegionContact' )
            .where( 'region', region )
            .populate( fieldsToPopulate )
            .exec()
            .then( CSCRegionContact => {
                // if no matching CSC region contact was found in the database
                if( !CSCRegionContact ) {
                    // reject the promise with the reason for the rejection
                    return reject( new Error( `no CSC region contact found for the region with id ${ region }` ) );
                }
                // resolve the promise with an object containing the name and email address of the target contact
                resolve( CSCRegionContact );
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( new Error( `error fetching CSC region contact for the region with id ${ region }` ) );
            });
    });
};