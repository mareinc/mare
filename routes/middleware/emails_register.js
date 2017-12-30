const keystone				= require( 'keystone' ),
	  utilitiesMiddleware   = require( './utilities' );

exports.sendNewSiteVisitorNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SITE_VISITOR_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff was contact provided` );
		}

		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let heardAboutMAREFromArray = [];

		for( entry of user.heardAboutMAREFrom ) {
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// store only the fields that have been populated by the user
		if( user.name.first ) { userData.push( { key: 'first name', value: user.name.first } ); }
		if( user.name.last ) { userData.push( { key: 'last name', value: user.name.last } ); }
		if( user.email ) { userData.push( { key: 'email', value: user.email } ); }
		if( user.phone.work ) { userData.push( { key: 'work phone', value: user.phone.work } ); }
		if( user.phone.home ) { userData.push( { key: 'home phone', value: user.phone.home } ); }
		if( user.phone.mobile ) { userData.push( { key: 'mobile phone', value: user.phone.mobile } ); }
		if( user.phone.preferred ) { userData.push( { key: 'preferred phone', value: user.phone.preferred } ); }
		if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); }
		if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); }
		if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }
		if( heardAboutMAREFromArray.length !== 0 ) { userData.push( { key: 'heard about MARE from', value: heardAboutMAREFromArray } ); }
		if( user.heardAboutMAREFromOther ) { userData.push( { key: 'heard about MARE from - other', value: user.heardAboutMAREFromOther } ); }

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'register_new-user-notification-to-staff'
		}).send({
			to				: 'jared.j.collier@gmail.com',
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new ${ user.userType } registration`,
			userType		: user.userType,
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new site visitor notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new site visitor notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendNewSocialWorkerNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SOCIAL_WORKER_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff contact was provided` );
		}
		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let userMailingListData = [];

		// store only the fields that have been populated by the user
		if( user.name.first ) { userData.push( { key: 'first name', value: user.name.first } ); }
		if( user.name.last ) { userData.push( { key: 'last name', value: user.name.last } ); }
		if( user.email ) { userData.push( { key: 'email', value: user.email } ); }
		if( user.position ) { userData.push ( { key: 'position', value: user.position } ); } 
		if( user.title ) { userData.push( { key: 'title', value: user.title } ); }
		if( user.agencyText ) { userData.push( { key: 'agency', value: user.agencyText } ); }
		if( user.phone.work ) { userData.push( { key: 'work phone', value: user.phone.work } ); }
		if( user.phone.mobile ) { userData.push( { key: 'mobile phone', value: user.phone.mobile } ); }
		if( user.phone.preferred ) { userData.push( { key: 'preferred phone', value: user.phone.preferred } ); }
		if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); } // POPULATE IT
		if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); }
		if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'register_new-user-notification-to-staff'
		}).send({
			to				: 'jared.j.collier@gmail.com',
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new ${ user.userType } registration`,
			userType		: user.userType,
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new social worker notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new social worker notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendNewFamilyNotificationEmailToMARE = ( user, userEmail, registrationStaffContact ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_FAMILY_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !registrationStaffContact ) {
			return reject( `no staff contact was provided` );
		}
		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let heardAboutMAREFromArray = []; // add contact1gender contact1race array and contact2 gender, contact2race array, primaryLanguage, child1-x genders

		for( entry of user.heardAboutMAREFrom ) {
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// store only the fields that have been populated by the user
		if( user.email ) { userData.push( { key: 'email', value: user.email } ); }
		// contact 1
		if( user.contact1.name.first ) { userData.push( { key: 'contact 1 first name', value: user.contact1.name.first } ); }
		if( user.contact1.name.last ) { userData.push( { key: 'contact 1 last name', value: user.contact1.name.last } ); }
		if( user.contact1.email ) { userData.push( { key: 'contact 1 email', value: user.contact1.email } ); }
		if( user.contact1.phone.mobile ) { userData.push( { key: 'contact 1 mobile phone', value: user.contact1.phone.mobile } ); }
		if( user.contact1.preferredCommunicationMethod ) { userData.push( { key: 'contact 1 preferred communication method', value: user.contact1.preferredCommunicationMethod } ); }
			if( user.contact1.gender.gender ) { userData.push( { key: 'gender', value: user.contact1.gender.gender } ); }
			if( user.contact1.race.race ) { userData.push( { key: 'contact 1 race', value: user.contact1.race.race } ); }
		if( user.contact1.occupation ) { userData.push( { key: 'contact 1 occupation', value: user.contact1.occupation } ); }
		if( user.contact1.birthDate ) { userData.push( { key: 'contact 1 date of birth', value: user.contact1.birthDate } ); }
		// contact 2 >
		if( user.contact2.name.first ) { userData.push( { key: 'contact 1 first name', value: user.contact2.name.first } ); }
		if( user.contact2.name.last ) { userData.push( { key: 'contact 1 last name', value: user.contact2.name.last } ); }
		if( user.contact2.email ) { userData.push( { key: 'contact 1 email', value: user.contact2.email } ); }
		if( user.contact2.phone.mobile ) { userData.push( { key: 'contact 1 mobile phone', value: user.contact2.phone.mobile } ); }
		if( user.contact2.preferredCommunicationMethod ) { userData.push( { key: 'contact 1 preferred communication method', value: user.contact2.preferredCommunicationMethod } ); }
			if( user.contact2.gender.gender ) { userData.push( { key: 'gender', value: user.contact2.gender.gender } ); }
			if( user.contact2.race.race ) { userData.push( { key: 'contact 1 race', value: user.contact2.race.race } ); }
		if( user.contact2.occupation ) { userData.push( { key: 'contact 1 occupation', value: user.contact2.occupation } ); }
		if( user.contact2.birthDate ) { userData.push( { key: 'contact 1 date of birth', value: user.contact2.birthDate } ); }

		if( user.address.street1 ) { userData.push( { key: 'street 1', value: user.address.street1 } ); }
		if( user.address.street2 ) { userData.push( { key: 'street 2', value: user.address.street2 } ); }
		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) { userData.push( { key: 'city', value: user.address.city.cityOrTown } ); }
		if( user.address.isOutsideMassachusetts && user.address.cityText ) { userData.push( { key: 'city', value: user.address.cityText } ); }
		if( user.address.state.state ) { userData.push( { key: 'state', value: user.address.state.state } ); }
		if( user.address.zipCode ) { userData.push( { key: 'zip code', value: user.address.zipCode } ); }
		if( user.homePhone ) { userData.push( { key: 'home phone', value: user.homePhone } ); }

		if( user.stages.gatheringInformation.started ) { userData.push( { key: 'gathering information started', value: user.stages.gatheringInformation.started } ); }
		if( user.stages.gatheringInformation.date ) { userData.push( { key: 'gathering information date', value: user.stages.gatheringInformation.date } ); }
		if( user.stages.lookingForAgency.started ) { userData.push( { key: 'looking for agency started', value: user.stages.lookingForAgency.started } ); }
		if( user.stages.lookingForAgency.date ) { userData.push( { key: 'looking for agency date', value: user.stages.lookingForAgency.date } ); }
		if( user.stages.workingWithAgency.started ) { userData.push( { key: 'working with agency started', value: user.stages.workingWithAgency.started } ); }
		if( user.stages.workingWithAgency.date ) { userData.push( { key: 'working with agency date', value: user.stages.workingWithAgency.date } ); }
		if( user.stages.MAPPTrainingCompleted.started ) { userData.push( { key: 'MAPP trainging completed', value: user.stages.MAPPTrainingCompleted.completed } ); }
		if( user.stages.MAPPTrainingCompleted.date ) { userData.push( { key: 'MAPP trainging date', value: user.stages.MAPPTrainingCompleted.date } ); }
		
		if( user.homestudy.completed ) { userData.push( { key: 'homestudy completed', value: user.homestudy.completed } ); }
		if( user.homestudy.initialDate ) { userData.push( { key: 'homestudy date', value: user.homestudy.initialDate } ); }
		if( user.socialWorkerText ) { userData.push( { key: 'social worker name', value: user.socialWorkerText } ); }
		// social worker agency
		// social worker phone number
		// social worker email address
		// family details
		if( user.numberOfChildren ) { userData.push( { key: 'number of children currently in home', value: user.numberOfChildren } ); }
		
		const numberOfChildrenInHome = user.numberOfChildren === '8+' ? 8 :
									   Number.isNaN( parseInt( user.numberOfChildren, 10 ) ) ? 0 :
									   parseInt( user.numberOfChildren, 10 );
		
		for( let i = 1; i <= numberOfChildrenInHome; i++ ) {
			if( user[ `child${ i }` ][ 'name' ] ) { userData.push( { key: 'child 1 name', value: user[ `child${ i }` ][ 'name' ] } ); }
			if( user[ `child${ i }` ][ 'birthDate' ] ) { userData.push( { key: 'child 1 date of birth', value: user[ `child${ i }` ][ 'birthDate' ] } ); }
			if( user[ `child${ i }` ][ 'gender' ] ) { userData.push( { key: 'child 1 gender', value: user[ `child${ i }` ][ 'gender' ] } ); }
			if( user[ `child${ i }` ][ 'type' ] ) { userData.push( { key: 'child 1 type', value: user[ `child${ i }` ][ 'type' ] } ); }
		}

		if( user.havePetsInHome ) { userData.push( { key: 'has pets in home', value: user.havePetsInHome } ); }
			if( user.language.language ) { userData.push( { key: 'primary language', value: user.language.language } ); }
		// other languages
		// adoption preferences >
		// genders preferred
		// legal status
		if( user.matchingPreferences.adoptionAges.from ) { userData.push( { key: 'prefers ages from', value: user.matchingPreferences.adoptionAges.from } ); }
		if( user.matchingPreferences.adoptionAges.to ) { userData.push( { key: 'prefers ages to', value: user.matchingPreferences.adoptionAges.to } ); }
		if( user.matchingPreferences.numberOfChildrenToAdopt ) { userData.push( { key: 'preferred number of children', value: user.matchingPreferences.numberOfChildrenToAdopt } ); }
		// these will be true/false, so checking for existence will exclude falsey values
		userData.push( { key: 'biological sibling contact ok', value: user.matchingPreferences.siblingContact } );
		userData.push( { key: 'biological family contact ok', value: user.matchingPreferences.birthFamilyContact } );
		// race
		if( user.matchingPreferences.maxNeeds.physical ) { userData.push( { key: 'maximum physical needs', value: user.matchingPreferences.maxNeeds.physical } ); }
		if( user.matchingPreferences.maxNeeds.emotional ) { userData.push( { key: 'maximum emotional needs', value: user.matchingPreferences.maxNeeds.emotional } ); }
		if( user.matchingPreferences.maxNeeds.intellectual ) { userData.push( { key: 'maximum intellectual needs', value: user.matchingPreferences.maxNeeds.intellectual } ); }
		// disabilities
		// other considerations FIX: NOT AN ARRAY, JUST A SINGLE VALUE
		if( heardAboutMAREFromArray.length !== 0 ) { userData.push( { key: 'heard about MARE from', value: heardAboutMAREFromArray } ); }
		if( user.heardAboutMAREFromOther ) { userData.push( { key: 'heard about MARE from - other', value: user.heardAboutMAREFromOther } ); }

		// find the email template in templates/emails/
		new keystone.Email({
			templateExt		: 'hbs',
			templateEngine 	: require( 'handlebars' ),
			templateName 	: 'register_new-user-notification-to-staff'
		}).send({
			to				: 'jared.j.collier@gmail.com',
			from: {
				name 		: 'MARE',
				email 		: 'admin@adoptions.io'
			},
			subject			: `new ${ user.userType } registration`,
			userType		: user.userType,
			userData,
			registrationStaffContact
		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending new family notification email to MARE - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending new family notification email to MARE - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendAccountVerificationEmailToUser = ( userEmail, userType, verificationCode, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_ACCOUNT_VERIFICATION_EMAILS_TO_USER !== 'true' ) {
			// reject the promise with information about why
			return reject( `sending of the email is disabled` );
		}

		if( !userEmail ) {
			return reject( `no user email was provided` );
		}

		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 		: 'hbs',
			templateEngine 		: require( 'handlebars' ),
			templateName 		: 'register_account-verification-to-user'

		}).send({

			to					: 'jared.j.collier@gmail.com',
			from: {
				name 			: 'MARE',
				email 			: 'admin@adoptions.io'
			},
			subject       		: 'please verify your MARE account',
			emailSubject		: `${ userType } registration question`,
			host,
			userType,
			verificationCode

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending account verification email to newly registered user - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending account verification email to newly registered user - ${ err }` );
			}

			resolve();
		});
	});
};

exports.sendThankYouEmailToUser = ( staffContactInfo = { email: 'jared.j.collier@gmail.com', name: 'Jared' } , userEmail, userType, host ) => {
	
	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_REGISTRATION_THANK_YOU_EMAILS !== 'true' ) {
			// resolve the promise before any further processing takes place
			return reject( `sending of the email is disabled` );
		}

		if( !userEmail ) {
			return reject( `no user email was provided` );
		}

		// find the email template in templates/emails/
		new keystone.Email({

			templateExt 		: 'hbs',
			templateEngine 		: require( 'handlebars' ),
			templateName 		: 'register_thank-you-to-user'

		}).send({

			to					: 'jared.j.collier@gmail.com',
			from: {
				name 			: 'MARE',
				email 			: 'admin@adoptions.io'
			},
			subject       		: 'thank you for registering',
			emailSubject		: `${ userType } registration question`,
			staffContactEmail	: staffContactInfo.email,
			staffContactName	: staffContactInfo.name,
			host,
			userType,
			verificationCode

		}, ( err, message ) => {
			// if there was an error sending the email
			if( err ) {
				// reject the promise with details
				return reject( `error sending thank you email to newly registered user - ${ err }` );
			}
			// the response object is stored as the 0th element of the returned message
			const response = message ? message[ 0 ] : undefined;
			// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
			if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
				// reject the promise with details
				return reject( `error sending thank you email to newly registered user - ${ err }` );
			}

			resolve();
		});
	});
};