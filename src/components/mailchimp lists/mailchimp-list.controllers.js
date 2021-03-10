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
 * getInterests
 * ============
 * @description get the interests of a particular category (interests are called 'groups' in the mailchimp admin panel)
 * @param {String} mailingListId the id of the mailing list to get interests from
 * @param {String} categoryId the id of the category to get interests from
 * @returns {Object} containing an array of interests
 */
 exports.getInterests = function getInterests( mailingListId, categoryId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !mailingListId || !categoryId ) {
            return reject( new Error( 'getInterests failed - either mailingListId or categoryId was not provided.' ) );
        }

        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}/interest-categories/{interest_category_id}/interests', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                interest_category_id: categoryId
            }
        })
        .then( interests => resolve( interests ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * getInterestCategories
 * =====================
 * @description get the interest categories for a mailing list (interests are called 'groups' in the mailchimp admin panel)
 * @param {String} mailingListId the id of the mailing list to get categories from
 * @returns {Object} containing an array of interest categories
 */
 exports.getInterestCategories = function getInterestCategories( mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !mailingListId ) {
            return reject( new Error( 'getInterestCategories failed - mailingListId was not provided.' ) );
        }

        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}/interest-categories', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId
            }
        })
        .then( categories => resolve( categories ) )
        .catch( err => reject( new Error( err.message ) ) );
    });
};

/**
 * subscribeMemberToList
 * =====================
 * @description subscribes a member to a mailing list
 * @param {String} email the email with which to register the member
 * @param {String} mailingListId the id of the mailing list to subscribe to
 * @param {String} firstName the first name of the subscriber
 * @param {String} lastName the last name of the subscriber
 * @param {Array} tags a list of tags to apply to the user
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.subscribeMemberToList = function subscribeMemberToList( { email, mailingListId, firstName = '', lastName = '', tags = [] } ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !email || !mailingListId ) {
            return reject( new Error( 'subscribeMemberToList failed - email or mailingListId was not provided.' ) );

        // check to ensure Mailchimp updates are turned on for the current enviornment
        } else if ( !ALLOW_MAILCHIMP_API_UPDATES ) {
            return resolve();
        }

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
 * =========================
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
 * =================
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
        .catch( err => reject( err ) );
    });
};

/**
 * updateMemberTags
 * ================
 * @description update the tags for a member
 * @param {String} email the email of the member to update
 * @param {String} mailingListId the id of the mailing list in which to update the member
 * @param {Array} tags a list of tags in the following format { name: 'tagName', status: 'inactive' || 'active' }
 * @returns {Object} status code of the operation
 */
exports.updateMemberTags = function updateMemberTags( email, tags = [], mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( tags.length === 0 || !email || !mailingListId ) {
            return reject( new Error( 'updateMemberTags failed - email, mailingListId, or tags were not provided.' ) );

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
                tags
            }
        })
        .then( status => resolve( status ) )
        .catch( err => reject( err ) );
    });
};

/**
 * getMemberFromList
 * =================
 * @description get a member from a mailing list
 * @param {String} email the email of the member to unsubscribe
 * @param {String} mailingListId the id of the mailing list to unsubscribe the member from
 * @returns {Object} member object
 */
exports.getMemberFromList = function getMemberFromList( email, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !email || !mailingListId ) {
            return reject( new Error( 'getMemberFromList failed - email or mailingListId was not provided.' ) );
        }

        _mailchimp.request({
            method: 'get',
            path: '/lists/{list_id}/members/{subscriber_hash}', // this is not a template string, rather a mailchimp-api-v3 library convention
            path_params: {
                list_id: mailingListId,
                subscriber_hash: MD5( email )
            }
        })
        .then( member => resolve( member ) )
        .catch( err => reject( err ) );
    });
};

/**
 * updateMemberInterests
 * =====================
 * @description get a member from a mailing list
 * @param {String} email the email of the member to unsubscribe
 * @param {String} mailingListId the id of the mailing list to unsubscribe the member from
 * @param {Object} interests a map of interests in the following format { 'interestId': true || false }
 * @returns {Object} member object
 */
exports.updateMemberInterests = function updateMemberInterests( email, mailingListId, interests ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure required params were passed
        if ( !email || !mailingListId || !interests ) {
            return reject( new Error( 'updateMemberInterests failed - email, mailingListId, or interests was not provided.' ) );

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
                interests
            }
        })
        .then( member => resolve( member ) )
        .catch( err => reject( err ) );
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
