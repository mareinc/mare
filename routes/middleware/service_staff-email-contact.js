const keystone			= require( 'keystone' ),
      StaffEmailContact = keystone.list( 'Staff Email Contact' );

exports.getContact = targetId => {

    return new Promise( ( resolve, reject ) => {

        StaffEmailContact.model
            .findOne()
            .select( 'staffEmailContact' )
            .where( 'emailTarget', targetId )
            .populate( 'staffEmailContact' )
            .exec()
            .then( staffContact => {
                // if no matching staff contact was found in the database
                if( !staffContact ) {
                    // reject the promise with the reason for the rejection
                    return reject( `no staff contact found for the provided id: ${ targetId }` );
                }
                // resolve the promise with an object containing the name and email address of the target contact
                resolve({
                    name: staffContact.staffEmailContact.name.full,
                    email: staffContact.staffEmailContact.get( 'email' )
                });
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( `error fetching staff email contact for ${ targetId }` );
            });
    });
}