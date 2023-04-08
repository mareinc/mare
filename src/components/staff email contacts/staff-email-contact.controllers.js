const keystone = require( 'keystone' );
const listService = require( '../lists/list.controllers' );
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

exports.getStaffEmailContactsByEmailTarget = ({ emailTargetId, fieldsToPopulate = [] }) => {

    return new Promise( ( resolve, reject ) => {

        keystone.list( 'Staff Email Contact' ).model
            .find()
            .where( 'emailTarget', emailTargetId )
            .populate( fieldsToPopulate )
            .exec()
            .then( staffEmailContacts => {
                // if no matching staff email contacts were found
                if( !staffEmailContacts ) {
                    // reject the promise with the reason for the rejection
                    return reject( new Error( `no staff email contacts matching ids '${ emailTargetIds } could be found` ) );
                }
                // if any staff email contacts were found, resolve the promise with the array of models
				resolve( staffEmailContacts );
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( new Error( `error fetching staff email contacts matching ids ${ emailTargetIds }` ) );
            });
    });
};

exports.getStaffEmailContactByEmailTargetName = async( emailTargetName, fieldsToPopulate = [ 'staffEmailContact' ], fallbackStaffContact ) => {

    try {
        // get the email target
        const emailTargetDoc = await listService.getEmailTargetByName( emailTargetName );
        // get the staff contact from assigned to that email target
        const staffEmailContactDoc = await exports.getStaffEmailContactByEmailTarget( emailTargetDoc._id, fieldsToPopulate );
        // get the email from the staff contact doc
        const staffEmailContact = staffEmailContactDoc.staffEmailContact.email;
        // ensure an email address was retrieved
        if ( staffEmailContact ) {
            return staffEmailContact;
        } else {
            throw new Error( `no staff email contact was found, fallback value of ${fallbackStaffContact} will be used instead` );
        }
    } catch( error ) {
        // log the error
        console.error( 'getStaffEmailContactByEmailTargetName failed', error );
        // return the fallback staff contact
        return fallbackStaffContact;
    }
};
