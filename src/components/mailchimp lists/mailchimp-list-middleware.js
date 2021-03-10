const mailchimpService = require( './mailchimp-list.controllers' );
const flashMessages	= require( '../../utils/notification.middleware' );

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
    mailchimpService.updateMemberInterests( req.user.email, process.env.MAILCHIMP_AUDIENCE_ID, updatesObject )
        .then( () => {
            
            // display a message to the user
			flashMessages.appendFlashMessage({
				messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
				title: 'Success',
				message: 'Preferences updated'
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
				title: 'Error',
				message: 'Try again'
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