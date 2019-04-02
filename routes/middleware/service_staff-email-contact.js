const keystone = require( 'keystone' );
// TODO: clean this up to just return the contact whole, the calling function should take what it needs from it.
//       References to it should be replaced by the function getStaffEmailContactById() below
exports.getContactById = targetId => {

    return new Promise( ( resolve, reject ) => {

        keystone.list( 'Staff Email Contact' ).model
            .findOne()
            .select( 'staffEmailContact' )
            .where( 'emailTarget', targetId )
            .populate( 'staffEmailContact' )
            .exec()
            .then( staffContact => {
                // if no matching staff contact was found in the database
                if( !staffContact ) {
                    // reject the promise with the reason for the rejection
                    return reject( new Error( `no staff contact found for the id ${ targetId }` ) );
                }
                // resolve the promise with an object containing the name and email address of the target contact
                resolve({
                    name: staffContact.staffEmailContact.name.full,
                    email: staffContact.staffEmailContact.get( 'email' )
                });
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( new Error( `error fetching staff email contact by id ${ targetId }` ) );
            });
    });
};

exports.getStaffEmailContactByEmailTarget = ( emailTargetId, fieldsToPopulate = [] ) => {

    return new Promise( ( resolve, reject ) => {

        keystone.list( 'Staff Email Contact' ).model
            .findOne()
            .where( 'emailTarget', emailTargetId )
            .populate( fieldsToPopulate )
            .exec()
            .then( staffEmailContact => {
                // if no matching staff email contact
                if( !staffEmailContact ) {
                    // reject the promise with the reason for the rejection
                    return reject( new Error( `no staff email target matching id '${ id } could be found` ) );
                }
                // if the staff email contact was found, resolve the promise with the model
				resolve( staffEmailContact );
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( new Error( `error fetching staff email contact matching id ${ targetId }` ) );
            });
    });
};