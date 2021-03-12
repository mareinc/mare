const mailchimpService = require( './mailchimp-list.controllers' );
const flashMessages	= require( '../../utils/notification.middleware' );
const MAILING_LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

exports.updateMailingListPreferences = function updateMailingListPreferences( req, res, next ) {

    // get the preference updates from the request body
    const mailingListPreferenceUpdates = req.body.updates;
    const userEmail = req.user && req.user.email;

    if ( !mailingListPreferenceUpdates || !userEmail  ) {
        console.error( `updateMailingListPreferences failed - no update object or user provided` );
        return res.send( { status: 'error' } );
    }

    // convert update list data to updates object (expected format in mailchimp api)
    const updatesObject = mailingListPreferenceUpdates.reduce( ( updates, update ) => {
        updates[ update.groupId ] = update.status === 'active';
        return updates;
    }, {} );
    
    // initialize error flag
    let hasError = false;

    // update the member's interests (groups) in mailchimp
    mailchimpService.updateMemberInterests( req.user.email, MAILING_LIST_ID, updatesObject )
        .then( () => {
            
            // display a message to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
				title: 'Success!',
				message: 'Your email preferences have been successfully updated.'
			});
        })
        .catch( error => {

            // log the error
            console.error( error );
            // update the error flag
            hasError = true;
            // display a message to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.ERROR,
				title: 'Something Went Wrong',
				message: 'Please try updating your preferences again. If problems persist, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>.'
			});
        })
        .finally( () => {

            // send the error status and flash message markup
			flashMessages.generateFlashMessageMarkup()
                .then( flashMessageMarkup => {
                    res.send({
                        status: hasError ? 'error' : 'success',
                        flashMessage: flashMessageMarkup
                    });
                });
        });
};

exports.unsubscribeUserFromMailingList = function unsubscribeUserFromMailingList( req, res, next ) {

    // get the user email from the request body
    const userEmail = req.user && req.user.email;
    // initialize error flag
    let hasError = false;

    mailchimpService.unsubscribeMemberFromList( userEmail, MAILING_LIST_ID )
        .then( () => {

            // display a message to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
				title: 'Success!',
				message: 'Your have been unsubscribed from the MARE email list.'
			});
        })
        .catch( error => {

            // log the error
            console.error( error );
            // update the error flag
            hasError = true;
            // display a message to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.ERROR,
				title: 'Something Went Wrong',
				message: 'Please try unsubscribing again. If problems persist, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>.'
			});
        })
        .finally( () => {

            // send the error status and flash message markup
			flashMessages.generateFlashMessageMarkup()
                .then( flashMessageMarkup => {
                    res.send({
                        status: hasError ? 'error' : 'success',
                        flashMessage: flashMessageMarkup
                    });
                });
        });
}