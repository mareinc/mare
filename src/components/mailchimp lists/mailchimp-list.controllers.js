const   keystone  = require( 'keystone' ),
        Mailchimp = require( 'mailchimp-api-v3' ),
        MD5       = require( 'md5' );

// set constants
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const ALLOW_MAILCHIMP_API_UPDATES = process.env.ALLOW_MAILCHIMP_API_UPDATES === 'true';
// configure the Mailchimp connection instance
const _mailchimp = new Mailchimp( MAILCHIMP_API_KEY );

/**
 * getMailingLists
 * ===============
 * @description gets all mailing lists
 * @returns {Array} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/CollectionResponse.json
 */
exports.getMailingLists = function getMailingLists() {

    return new Promise( ( resolve, reject ) => {

        _mailchimp.request({
            method: 'get',
            path: '/lists'
        })
        .then( mailingLists => resolve( mailingLists ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * getMailingList
 * ==============
 * @description get a specific mailing list by id
 * @param {String} mailingListId the id of the mailing list to get
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Response.json
 */
exports.getMailingList = function getMailingList( mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !mailingListId ) {
            return reject( new Error( 'getMailingList failed - no mailingListId was provided.' ) );
        }

        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId
            }
        })
        .then( mailingList => resolve( mailingList ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * subscribeMemberToList
 * ===================
 * @description subscribes a member to a mailing list
 * @param {String} email the email with which to register the member
 * @param {String} mailingListId the id of the mailing list to subscribe to
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.subscribeMemberToList = function subscribeMemberToList( { email, mailingListId, userType, firstName = '', lastName = '' } ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !email || !mailingListId ) {
            return reject( new Error( 'subscribeMemberToList failed - email or mailingListId was not provided.' ) );

        // check to ensure Mailchimp updates are turned on for the current enviornment
        } else if ( !ALLOW_MAILCHIMP_API_UPDATES ) {
            return resolve();
        }

        // tag the member with their user type (if known)
        let tags = userType
            ? [ userType ]
            : [];

        _mailchimp.request({
            method: 'put',
            path: '/lists/{list_id}/members/{subscriber_hash}', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            },
            body: {
                email_address: email,
                status_if_new: 'subscribed',
                status: 'subscribed',
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                },
                tags
            }
        })
        .then( subscriber => resolve( subscriber ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * unsubscribeMemberFromList
 * ========================
 * @description unsubscribes a member from a mailing list
 * @param {String} email the email of the member to unsubscribe
 * @param {String} mailingListId the id of the mailing list to unsubscribe the member from
 * @returns {Object} status of the operation
 */
 exports.unsubscribeMemberFromList = function unsubscribeMemberFromList( email, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !email || !mailingListId ) {
            return reject( new Error( 'unsubscribeMemberFromList failed - email or mailingListId was not provided.' ) );

        // check to ensure Mailchimp updates are turned on for the current enviornment
        } else if ( !ALLOW_MAILCHIMP_API_UPDATES ) {
            return resolve();
        }

        _mailchimp.request({
            method: 'patch',
            path: '/lists/{list_id}/members/{subscriber_hash}', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            },
            body: {
                status: 'unsubscribed'
            }
        })
        .then( status => resolve( status ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
 };

/**
 * updateMemberEmail
 * =====================
 * @description updates a member's email address in a particular mailing list
 * @param {String} currentEmail the member's current email address
 * @param {String} updatedEmail the new email address that will replace the current email address
 * @param {String} mailingListId the id of the mailing list in which to update the member
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.updateMemberEmail = function updateMemberEmail( currentEmail, updatedEmail, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !currentEmail || !updatedEmail || !mailingListId ) {
            return reject( new Error( 'updateMemberEmail failed - currentEmail, updatedEmail, or mailingListId was not provided.' ) );

        // check to ensure Mailchimp updates are turned on for the current enviornment
        } else if ( !ALLOW_MAILCHIMP_API_UPDATES ) {
            return resolve();
        }

        _mailchimp.request({
            method: 'patch',
            path: '/lists/{list_id}/members/{subscriber_hash}', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( currentEmail )
            },
            body: {
                email_address: updatedEmail
            }
        })
        .then( subscriber => resolve( subscriber ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * updateMemberTag
 * ==================
 * @description update the tag for a member
 * @param {String} email the email of the member to update
 * @param {String} mailingListId the id of the mailing list in which to update the member
 * @returns {Object} status code of the operation
 */
exports.updateMemberTag = function updateMemberTag( { tagName, email, mailingListId, removeTag = false } ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !tagName || !email || !mailingListId ) {
            return reject( new Error( 'updateMemberTag failed - tagName, email, or mailingListId was not provided.' ) );

        // check to ensure Mailchimp updates are turned on for the current enviornment
        } else if ( !ALLOW_MAILCHIMP_API_UPDATES ) {
            return resolve();
        }

        _mailchimp.request({
            method: 'post',
            path: '/lists/{list_id}/members/{subscriber_hash}/tags', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            },
            body: {
                tags: [
                    {
                        name: tagName,
                        status: removeTag ? 'inactive' : 'active'
                    }
                ]
            }
        })
        .then( status => resolve( status ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * validateWebhook
 * ==================
 * @description sends a success (200) response when Mailchimp makes a GET request to validate the webhook URL
 */
exports.validateWebhookURL = function validateWebhookURL( req, res, next ) {
    res.status(200).send();
};

/**
 * processWebhookUpdates
 * ==================
 * @description processess subscriber updates broadcast from Mailchimp
 */
exports.processWebhookUpdates = function processWebhookUpdates( req, res, next ) {

    // ensure the request data exists in the expected format
    if ( !req.body || !req.body.data ) {
        return next( new Error( 'Error processing Mailchimp webhook - empty or malformed request body' ) );
    }
    // destructure request data
    let {
        type: action,
        data: {
            email: userEmail,
            list_id: mailingListId
        }
    } = req.body;

    switch ( action ) {
        case 'subscribe':
            Promise.all([
                keystone.list( 'User' ).model
                    .findOne()
                    .where( 'email', userEmail )
                    .exec(),
                keystone.list( 'Mailchimp List' ).model
                    .findOne()
                    .where( 'mailchimpId', mailingListId )
                    .exec()
            ])
            .then( data => {
                let [ userDoc, mailchimpListDoc ] = data;

                if ( userDoc ) {
                    userDoc.mailingLists.addToSet( mailchimpListDoc._id.toString() );
                    return userDoc.save();
                } else {
                    console.log( `Subscriber with email: ${userEmail} subscribed to ${mailchimpListDoc.name}, but no matching user exists in Keystone.` );
                    return false;
                }
            })
            .then( () => res.status( 200 ).send() )
            .catch( err => {
                console.error( err );
                next( new Error( err.message ) );
            });
            break;
        case 'unsubscribe':
            keystone.list( 'User' ).model
                .findOne()
                .where( 'email', userEmail )
                .populate( 'mailingLists' )
                .exec()
                .then( userDoc => {
                    if ( userDoc ) {
                        userDoc.mailingLists = userDoc.mailingLists.filter( mailingList => mailingList.mailchimpId !== mailingListId );
                        return userDoc.save();
                    } else {
                        console.log( `Subscriber with email: ${userEmail} unsubscribed from a mailing list, but no matching user exists in Keystone.` );
                        return false;
                    }
                 })
                .then( () => res.status( 200 ).send() )
                .catch( err => {
                    console.error( err );
                    next( new Error( err.message ) );
                });
            break;
        default:
            return next( new Error( `Error processing Mailchimp webhook - unknown action encountered: ${action}` ) );
    }
};
