const keystone				= require( 'keystone' ),
	  utilitiesMiddleware   = require( './utilities' );
/* TODO: registrationStaffContact can either be determined before and passed in, or found in this function */
exports.sendRegistrationConfirmationEmailToStaff = user => {
	/* 	Information in email to staff:
			child's name and registration number
			a link to the child model in keystone
			name, email, and phone number of social worker
			possibly agency, address, other information (check with Lisa)
	
	   	Notes in email to staff:
			siteVisibility needs to be updated
			registeredBy needs to be selected
			physicalNeeds needs to be set
			emotionalNeeds needs to be set
			intellectualNeeds needs to be set
			socialNeeds needs to be set

	  		If sibling names exist:
				update the siblings field in the new model
				check that the child has been automatically added to all siblings
	
			If siblings must be placed together is true
				check the siblings must be placed together checkbox
				update the siblings to be placed with field
				check that the 'must be placed with siblings' checkbox has been check in all sibling records
				check that the child has been automatically added to the siblings to be placed with field of all siblings
	*/
	return new Promise( ( resolve, reject ) => {
		// do nothing if sending of the email is not currently allowed
		if( process.env.SEND_SOCIAL_WORKER_CHILD_REGISTRATION_EMAILS_TO_MARE === 'false' ) {
			// log the error
			console.error( 'sending of social worker child registration emails to MARE staff is currently disabled' );
			// reject the promise
			reject();
		}
		// the email template can be found in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'social-worker-child-registration_to-mare'
		}).send({
			to: registrationStaffContact,
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			},
			subject		: `new social worker child registration`
		
		}, ( err, message ) => {
			// log any errors
			if( err ) {
				console.error( `social worker child registration email to MARE staff failed to send: ${ err }` );
				reject();
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				console.log( `social worker child registration email to MARE staff failed to send: ${ message }` );
				reject();
			}
			// if we got this far, there were no errors, so we can resolve the promise
			resolve();
		});
	});
};
/* TODO: registrationStaffContact can either be determined before and passed in, or found in this function */
exports.sendRegistrationConfirmationEmailToSocialWorker = ( user ) => {

	return new Promise( ( resolve, reject ) => {
		// do nothing if sending of the email is not currently allowed
		if( process.env.SEND_SOCIAL_WORKER_CHILD_REGISTRATION_EMAILS_TO_SOCIAL_WORKER === 'false' ) {
			// log the error
			console.error( 'sending of social worker child registration emails to the social worker is currently disabled' );
			// reject the promise
			reject();
		}
		// the email template can be found in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'social-worker-child-registration_to-social-worker'
		}).send({
			to: registrationStaffContact,
			from: {
				name 	: 'MARE',
				email 	: 'admin@adoptions.io'
			},
			subject		: `child registration details`
		
		}, ( err, message ) => {
			// log any errors
			if( err ) {
				console.error( `social worker child registration email to the social worker failed to send: ${ err }` );
				reject();
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				console.log( `social worker child registration email to the social worker failed to send: ${ message }` );
				reject();
			}
			// if we got this far, there were no errors, so we can resolve the promise
			resolve();
		});
	});
};