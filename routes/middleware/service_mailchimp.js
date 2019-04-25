const   Mailchimp = require( 'mailchimp-api-v3' ),
        MD5       = require( 'md5' );

// set constants
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
// configure the MailChimp connection instance
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
        .catch( error => {
            console.error( error );
            reject( error );
        });
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
            return reject( 'getMailingList failed - no mailingListId was provided.' );
        }

        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}',
            path_params: {
                list_id: mailingListId
            }
        })
        .then( mailingList => resolve( mailingList ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
};

/**
 * addSubscriberToList
 * ===================
 * @description adds a subscriber to a mailing list
 * @param {String} email the email with which to register the subscriber
 * @param {String} mailingListId the id of the mailing list to subscribe to
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.addSubscriberToList = function addSubscriberToList( { email, mailingListId, userType, firstName = '', lastName = '' } ) {

    return new Promise( ( resolve, reject ) => {

        if ( !email || !mailingListId ) {
            return reject( 'addSubscriberToList failed - email or mailingListId was not provided.' );
        }

        // tag the member with their user type (if known)
        let tags = userType
            ? [ userType ]
            : [];

        _mailchimp.request({
            method: 'post',
            path: '/lists/{list_id}/members',
            path_params: {
                list_id: mailingListId
            },
            body: {
                email_address: email,
                // we may want the ability to set the status value dynamically in the future
                status: 'subscribed',
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                },
                tags
            }
        })
        .then( subscriber => resolve( subscriber ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
};

/**
 * removeSubscriberFromList
 * ========================
 * @description removes a subscriber from a mailing list
 * @param {String} email the email of the subscriber to remove
 * @param {String} mailingListId the id of the mailing list to remove the subscriber from
 * @returns {Object} status of the operation
 */
 exports.removeSubscriberFromList = function removeSubscriberFromList( email, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !email || !mailingListId ) {
            return reject( 'removeSubscriberFromList failed - email or mailingListId was not provided.' );
        }

        _mailchimp.request({
            method: 'delete',
            path: '/lists/{list_id}/members/{subscriber_hash}',
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            }
        })
        .then( status => resolve( status ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
 };

/**
 * updateSubscriberEmail
 * =====================
 * @description updates a subscribers email address in a particular mailing list
 * @param {String} currentEmail the currently subscribed email address
 * @param {String} updatedEmail the new email address that will replace the current email address
 * @param {String} mailingListId the id of the mailing list in which to update the subscriber
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.updateSubscriberEmail = function updateSubscriberEmail( currentEmail, updatedEmail, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !currentEmail || !updatedEmail || !mailingListId ) {
            return reject( 'updateSubscriberEmail failed - currentEmail, updatedEmail, or mailingListId was not provided.' );
        }

        _mailchimp.request({
            method: 'patch',
            path: '/lists/{list_id}/members/{subscriber_hash}',
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( currentEmail )
            },
            body: {
                email_address: updatedEmail
            }
        })
        .then( subscriber => resolve( subscriber ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
};

/**
 * addTagToSubscriber
 * ==================
 * @description adds a tag to a subscriber
 * @param {String} email the email of the subscriber to add a tag to
 * @param {String} mailingListId the id of the mailing list in which to update the subscriber
 * @returns {Object} status code of the operation
 */
exports.addTagToSubscriber = function addTagToSubscriber( tagName, email, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !tagName || !email || !mailingListId ) {
            return reject( 'addTagToSubscriber failed - tagName, email, or mailingListId was not provided.' );
        }

        _mailchimp.request({
            method: 'post',
            path: '/lists/{list_id}/members/{subscriber_hash}/tags',
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            },
            body: {
                tags: [
                    {
                        name: tagName,
                        status: 'active'
                    }
                ]
            }
        })
        .then( status => resolve( status ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
}

/**
 * processWebhookUpdates
 * ==================
 * @description processess subscriber updates broadcast from Mailchimp
 */
exports.processWebhookUpdates = function processWebhookUpdates( req, res, next ) {

    // ensure the request data exists in the expected format
    if ( !req.body || !req.body.data ) {
        return next('Error processing Mailchimp webhook - empty or malformed request body');
    }
    // destructure request data
    let {
        type: action,
        data: {
            email: userEmail,
            list_id: sourceList
        }
    } = req.body;

    console.log(`Mailchimp Webhook Processed with Data:\n${req.body}`);

    switch ( action ) {
        case 'subscribe':
            console.log(`user subscribed: ${userEmail}`);
            break;
        case 'unsubscribe':
            console.log(`user unsubscribed: ${userEmail}`);
            break;
        default:
            return next(`Error processing Mailchimp webhook - unknown action encountered: ${action}`);
    }
    res.status(200).send();
}
