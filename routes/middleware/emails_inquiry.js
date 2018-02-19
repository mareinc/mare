const keystone = require( 'keystone' );

exports.sendNewInquiryEmailToMARE = ( { inquiryData, inquirerData, staffEmail } ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_INQUIRY_RECEIVED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with details about the reason
			return reject( `sending of the email is disabled` );
		}

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt 	: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'inquiry_staff-notification'
		}).send({
			to				: staffEmail,
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new ${ inquiryData.inquiryType }`,
			inquiryData,
			inquirerData

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new inquiry notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				reject( `error sending new inquiry notification email to MARE - ${ message } - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendThankYouEmailToFamilyOnBehalfOfInquirer = ( inquiry, inquiryData, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.SEND_INQUIRY_RECEIVED_ON_BEHALF_OF_EMAILS_TO_FAMILY !== 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_thank-you-to-family-on-behalf-of-social-worker'
	}).send({
		to: inquiryData.emailAddressFamilyOnBehalfOf,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'your inquiry has been received',
		inquiry: inquiry,
		inquiryData: inquiryData
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `thank you to family on behalf of inquirer email failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}

		console.log( `thank you to family on behalf of inquirer email sent successfully` );
		// mark the inquiry thank you email as having been sent to prevent it being sent in the future
		inquiry.thankYouSentToFamilyOnBehalfOfInquirer = true;
		done();
	});

};

exports.sendInquiryAcceptedEmailToInquirer = ( inquiry, inquiryData, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.SEND_INQUIRY_ACCEPTED_EMAILS_TO_INQUIRER !== 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-inquirer'
	}).send({
		to: inquiryData.emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for inquirer',
		inquiry: inquiry,
		inquiryData: inquiryData
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `inquiry accepted inquirer email failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}
		console.log( `inquiry accepted email successfully sent to inquirer` );
		// mark the inquiry accepted email as having been sent to the inquirer to prevent it being sent in the future
		inquiry.approvalEmailSentToInquirer = true;
		done();
	});
};

exports.sendInquiryAcceptedEmailToFamilyOnBehalfOfInquirer = ( inquiry, inquiryData, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.SEND_INQUIRY_ACCEPTED_ON_BEHALF_OF_EMAILS_TO_FAMILY !== 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-family-on-behalf-of-inquirer'
	}).send({
		to: inquiryData.emailAddressInquirer,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for inquirer',
		inquiry: inquiry,
		inquiryData: inquiryData
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `inquiry accepted on behalf of email failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}
		console.log( `inquiry accepted on behalf of email successfully sent to family` );
		// mark the inquiry accepted email as having been sent to the inquirer to prevent it being sent in the future
		inquiry.approvalEmailSentToFamilyOnBehalfOfInquirer = true;
		done();
	});
};

exports.sendInquiryAcceptedEmailToChildsSocialWorker = ( inquiry, inquiryData, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.SEND_CHILD_INQUIRY_ACCEPTED_EMAILS_TO_CHILDS_SOCIAL_WORKER !== 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-social-worker'
	}).send({
		to: inquiryData.emailAddressChildsSocialWorker,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for social worker',
		inquiry: inquiry,
		inquiryData: inquiryData
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `inquiry accepted email to child's social worker failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}
		console.log( `inquiry accepted email successfully sent to child's social worker` );
		// mark the inquiry accepted email as having been sent to the social worker to prevent it being sent in the future
		inquiry.emailSentToChildsSocialWorker = true;
		done();
	});
};

exports.sendInquiryAcceptedEmailToAgencyContacts = ( inquiry, inquiryData, done ) => {
	// do nothing if sending of the email is not currently allowed
	if( process.env.SEND_GENERAL_INQUIRY_ACCEPTED_EMAILS_TO_AGENCY_CONTACTS !== 'true' ) {
		return done();
	}
	// find the email template in templates/emails/
	new keystone.Email({
		templateExt 	: 'hbs',
		templateEngine 	: require( 'handlebars' ),
		templateName 	: 'inquiry_inquiry-accepted-to-agency-contact'
	}).send({
		to: inquiryData.emailAddressesAgencyContacts,
		from: {
			name 	: 'MARE',
			email 	: 'admin@adoptions.io'
		},
		subject: 'inquiry information for agency contact',
		inquiry: inquiry,
		inquiryData: inquiryData
	}, ( err, message ) => {
		// log any errors
		if( err ) {
			console.log( `error sending staff email: ${ err }` );
			return done();
		}
		// the response object is stored as the 0th element of the returned message
		const response = message ? message[ 0 ] : undefined;
		// if the email failed to send, or an error occurred ( which is does, rarely ) causing the response message to be empty
		if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
			console.log( `inquiry accepted email to agency contacts failed to send: ${ message }` );
			console.log( `error: ${ err }` );
			return done();
		}
		console.log( `inquiry accepted email successfully sent to agency contacts` );
		// mark the inquiry accepted email as having been sent to the agency contacts to prevent it being sent in the future
		inquiry.emailSentToAgencies = true;
		done();
	});
};