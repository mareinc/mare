const Mailchimp = require( 'mailchimp-api-v3' );

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
 * ===============
 * @description get a specific mailing list by id
 * @param {String} mailingListId the id of the mailing list to get
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/CollectionResponse.json
 */
exports.getMailingList = function getMailingList( mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        // check to ensure a mailing list id was provided
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
 * ===============
 * @description adds a subscriber to a mailing list
 * @param {Document} userDoc a User document representing the subscriber
 * @param {String} mailingListId the id of the mailing list to get
 * @returns {Object} schema: https://us20.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json
 */
exports.addSubscriberToList = function addSubscriberToList( userDoc, mailingListId ) {

    return new Promise( ( resolve, reject ) => {

        if ( !userDoc || !mailingListId ) {
            return reject( 'addSubscriberToList failed - User or mailingListId was not provided.' );
        }

        _mailchimp.request({
            method: 'post',
            path: '/lists/{list_id}/members',
            path_params: {
                list_id: mailingListId
            },
            body: {
                email_address: userDoc.email,
                // we may want the ability to set the status value dynamically in the future
	            status: 'subscribed'
            }
        })
        .then( subscriber => resolve( subscriber ) )
        .catch( error => {
            console.error( error );
            reject( error );
        });
    });
};

exports.MCTEST = function MCTEST(req, res, next) {
    exports.addSubscriberToList({}, '0ac72cf9ba')
        .then( results => {
            console.log(results);
            res.send('success!');
        })
        .catch( error => {
            res.send('error!');
        });
};
