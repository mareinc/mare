const Email = require( 'keystone-email' ),
      hbs = require( 'hbs' );

exports.sendNewSiteVisitorNotificationEmailToMARE = ( user, registrationStaffContact, mailingListNames ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SITE_VISITOR_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if( !registrationStaffContact ) {
			return reject( new Error( `no staff was contact provided` ) );
		}

		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let heardAboutMAREFromArray = [];

		for( entry of user.heardAboutMAREFrom ) {
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// store only the fields that have been populated by the user
		if( user.name.first ) {
			userData.push({
				key: 'first name',
				value: user.name.first
			});
		}

		if( user.name.last ) {
			userData.push({
				key: 'last name',
				value: user.name.last
			});
		}

		if( user.email ) {
			userData.push({
				key: 'email',
				value: user.email
			});
		}

		if( user.phone.work ) {
			userData.push({
				key: 'work phone',
				value: user.phone.work
			});
		}

		if( user.phone.home ) {
			userData.push({
				key: 'home phone',
				value: user.phone.home
			});
		}

		if( user.phone.mobile ) {
			userData.push({
				key: 'mobile phone',
				value: user.phone.mobile
			});
		}

		if( user.phone.preferred ) {
			userData.push({
				key: 'preferred phone',
				value: user.phone.preferred
			});
		}

		if( user.address.street1 ) {
			userData.push({
				key: 'street 1',
				value: user.address.street1
			});
		}

		if( user.address.street2 ) {
			userData.push({
				key: 'street 2',
				value: user.address.street2
			});
		}

		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) {
			userData.push({
				key: 'city',
				value: user.address.city.cityOrTown
			});
		}

		if( user.address.isOutsideMassachusetts && user.address.cityText ) {
			userData.push({
				key: 'city',
				value: user.address.cityText
			});
		}

		if( user.address.state.state ) {
			userData.push({
				key: 'state',
				value: user.address.state.state
			});
		}

		if( user.address.zipCode ) {
			userData.push({
				key: 'zip code',
				value: user.address.zipCode
			});
		}

		if( heardAboutMAREFromArray.length !== 0 ) {
			userData.push({
				key: 'heard about MARE from',
				value: heardAboutMAREFromArray.join( ', ' )
			});
		}

		if( user.heardAboutMAREFromOther ) {
			userData.push({
				key: 'heard about MARE from - other',
				value: user.heardAboutMAREFromOther
			});
		}

		if( mailingListNames.length > 0 ) {
			userData.push({
				key: 'mailing lists',
				value: mailingListNames.join( ', ' )
			});
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'register_new-user-notification-to-staff',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                userType: user.userType,
				userData,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: registrationStaffContact.email,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: `new ${ user.userType } registration`
			// callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending new site visitor notification email to MARE` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new site visitor notification email to MARE - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};

exports.sendNewSocialWorkerNotificationEmailToMARE = ( user, registrationStaffContact, mailingListNames ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_SOCIAL_WORKER_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if( !registrationStaffContact ) {
			return reject( new Error( `no staff contact was provided` ) );
		}
		// an array was used instead of a Map because Mustache templates apparently can't handle maps
		let userData = [];
		let positionsArray = [];

		// loop through each position model which was populated when the user model was fetched
		for( entry of user.positions ) {
			// extract the text values associated with the model into the array
			positionsArray.push( entry.position );
		}

		// store only the fields that have been populated by the user
		if( user.name.first ) {
			userData.push({
				key: 'first name',
				value: user.name.first
			});
		}

		if( user.name.last ) {
			userData.push({
				key: 'last name',
				value: user.name.last
			});
		}

		if( user.email ) {
			userData.push({
				key: 'email',
				value: user.email
			});
		}


		if( user.title ) {
			userData.push({
				key: 'title',
				value: user.title
			});
		}

		if( user.agencyText ) {
			userData.push({
				key: 'agency',
				value: user.agencyText
			});
		}

		if( user.phone.work ) {
			userData.push({
				key: 'work phone',
				value: user.phone.work
			});
		}

		if( user.phone.mobile ) {
			userData.push({
				key: 'mobile phone',
				value: user.phone.mobile
			});
		}

		if( user.phone.preferred ) {
			userData.push({
				key: 'preferred phone',
				value: user.phone.preferred
			});
		}

		if( user.address.street1 ) {
			userData.push({
				key: 'street 1',
				value: user.address.street1
			});
		}

		if( user.address.street2 ) {
			userData.push({
				key: 'street 2',
				value: user.address.street2
			});
		}

		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) {
			userData.push({
				key: 'city',
				value: user.address.city.cityOrTown
			});
		}

		if( user.address.isOutsideMassachusetts && user.address.cityText ) {
			userData.push({
				key: 'city',
				value: user.address.cityText
			});
		}

		if( user.address.state.state ) {
			userData.push({
				key: 'state',
				value: user.address.state.state
			});
		}

		if( user.address.zipCode  ) {
			userData.push({
				key: 'zip code',
				value: user.address.zipCode
			});
		}

		if( mailingListNames.length > 0  ) {
			userData.push({
				key: 'mailing lists',
				value: mailingListNames.join( ', ' )
			});
		}

		if( positionsArray.length > 0  ) {
			userData.push({
				key: 'positions',
				value: positionsArray.join( ', ' )
			});
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'register_new-user-notification-to-staff',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                userType: user.userType,
				userData,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: registrationStaffContact.email,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: `new ${ user.userType } registration`
			// callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err  ) {
					// reject the promise with details
					return reject( new Error( `error sending new social worker notification email to MARE` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new social worker notification email to MARE - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};

exports.sendNewFamilyNotificationEmailToMARE = ( user, registrationStaffContact, mailingListNames ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_NEW_FAMILY_REGISTERED_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if( !registrationStaffContact ) {
			return reject( new Error( `no staff contact was provided` ) );
		}
		// arrays was used instead of a Maps because Mustache templates apparently can't handle Maps
		let userData = [],
			heardAboutMAREFromArray = [],
			contact1RaceArray = [],
			contact2RaceArray = [],
			otherLanguagesArray = [],
			matchingPreferencesGenderArray = [],
			matchingPreferencesLegalStatusArray = [],
			matchingPreferencesRaceArray = [];

		// loop through each way to hear about MARE model which was populated when the user model was fetched
		for( entry of user.heardAboutMAREFrom ) {
			// extract the text values associated with the model into the array
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// loop through each contact 1 race model which was populated when the user model was fetched
		for( entry of user.contact1.race) {
			// extract the text values associated with the model into the array
			contact1RaceArray.push( entry.race );
		}
		// loop through each contact 2 race model which was populated when the user model was fetched
		for( entry of user.contact2.race) {
			// extract the text values associated with the model into the array
			contact2RaceArray.push( entry.race );
		}
		// loop through each other language model which was populated when the user model was fetched
		for( entry of user.otherLanguages) {
			// extract the text values associated with the model into the array
			otherLanguagesArray.push( entry.language );
		}
		// loop through each matching preferences gender model which was populated when the user model was fetched
		for( entry of user.matchingPreferences.gender) {
			// extract the text values associated with the model into the array
			matchingPreferencesGenderArray.push( entry.gender );
		}
		// loop through each matching preferences legal status model which was populated when the user model was fetched
		for( entry of user.matchingPreferences.legalStatus) {
			// extract the text values associated with the model into the array
			matchingPreferencesLegalStatusArray.push( entry.legalStatus );
		}
		// loop through each matching preferences race model which was populated when the user model was fetched
		for( entry of user.matchingPreferences.race) {
			// extract the text values associated with the model into the array
			matchingPreferencesRaceArray.push( entry.race );
		}
		// store only the fields that have been populated by the user
		if( user.email ) {
			userData.push({
				key: 'email',
				value: user.email
			});
		}

		// contact 1
		if( user.contact1.name.first ) {
			userData.push({
				key: 'contact 1 first name',
				value: user.contact1.name.first
			});
		}

		if( user.contact1.name.last ) {
			userData.push({
				key: 'contact 1 last name',
				value: user.contact1.name.last
			});
		}

		if( user.contact1.email ) {
			userData.push({
				key: 'contact 1 email',
				value: user.contact1.email
			});
		}

		if( user.contact1.phone.mobile ) {
			userData.push({
				key: 'contact 1 mobile phone',
				value: user.contact1.phone.mobile
			});
		}

		if( user.contact1.preferredCommunicationMethod ) {
			userData.push({
				key: 'contact 1 preferred communication method',
				value: user.contact1.preferredCommunicationMethod
			});
		}

		if( user.contact1.gender && user.contact1.gender.gender ) {
			userData.push({
				key: 'contact 1 gender',
				value: user.contact1.gender.gender
			});
		}

		if( contact1RaceArray.length !== 0 ) {
			userData.push({
				key: 'contact 1 race',
				value: contact1RaceArray.join( ', ' )
			});
		}

		if( user.contact1.occupation ) {
			userData.push({
				key: 'contact 1 occupation',
				value: user.contact1.occupation
			});
		}

		if( user.contact1.birthDate ) {
			userData.push({
				key: 'contact 1 date of birth',
				value: `${ user.contact1.birthDate.getMonth() + 1 }/${ user.contact1.birthDate.getDate() }/${ user.contact1.birthDate.getFullYear() }`
			});
		}

		// contact 2
		if( user.contact2.name.first ) {
			userData.push({
				key: 'contact 2 first name',
				value: user.contact2.name.first
			});
		}

		if( user.contact2.name.last ) {
			userData.push({
				key: 'contact 2 last name',
				value: user.contact2.name.last
			});
		}

		if( user.contact2.email ) {
			userData.push({
				key: 'contact 2 email',
				value: user.contact2.email
			});
		}

		if( user.contact2.phone.mobile ) {
			userData.push({
				key: 'contact 2 mobile phone',
				value: user.contact2.phone.mobile
			});
		}

		if( user.contact2.preferredCommunicationMethod ) {
			userData.push({
				key: 'contact 2 preferred communication method',
				value: user.contact2.preferredCommunicationMethod
			});
		}

		if( user.contact2.gender && user.contact2.gender.gender ) {
			userData.push({
				key: 'contact 2 gender',
				value: user.contact2.gender.gender
			});
		}

		if( contact2RaceArray.length !== 0 ) {
			userData.push({
				key: 'contact 2 race',
				value: contact2RaceArray.join( ', ' )
			});
		}

		if( user.contact2.occupation ) {
			userData.push({
				key: 'contact 2 occupation',
				value: user.contact2.occupation
			});
		}

		if( user.contact2.birthDate ) {
			userData.push({
				key: 'contact 2 date of birth',
				value: `${ user.contact2.birthDate.getMonth() + 1 }/${ user.contact2.birthDate.getDate() }/${ user.contact2.birthDate.getFullYear() }`
			});
		}

		if( user.address.street1 ) {
			userData.push({
				key: 'street 1',
				value: user.address.street1
			});
		}

		if( user.address.street2 ) {
			userData.push({
				key: 'street 2',
				value: user.address.street2
			});
		}

		if( !user.address.isOutsideMassachusetts && user.address.city.cityOrTown ) {
			userData.push({
				key: 'city',
				value: user.address.city.cityOrTown
			});
		}

		if( user.address.isOutsideMassachusetts && user.address.cityText ) {
			userData.push({
				key: 'city',
				value: user.address.cityText
			});
		}

		if( user.address.state.state ) {
			userData.push({
				key: 'state',
				value: user.address.state.state
			});
		}

		if( user.address.zipCode ) {
			userData.push({
				key: 'zip code',
				value: user.address.zipCode
			});
		}

		if( user.homePhone ) {
			userData.push({
				key: 'home phone',
				value: user.homePhone
			});
		}

		if( user.stages.gatheringInformation.started ) {
			userData.push({
				key: 'gathering information started',
				value: user.stages.gatheringInformation.started
			});
		}

		if( user.stages.gatheringInformation.date ) {
			userData.push({
				key: 'gathering information date',
				value: `${ user.stages.gatheringInformation.date.getMonth() + 1 }/${ user.stages.gatheringInformation.date.getDate() }/${ user.stages.gatheringInformation.date.getFullYear() }`
			});
		}

		if( user.stages.lookingForAgency.started ) {
			userData.push({
				key: 'looking for agency started',
				value: user.stages.lookingForAgency.started
			});
		}

		if( user.stages.lookingForAgency.date ) {
			userData.push({
				key: 'looking for agency date',
				value: `${ user.stages.lookingForAgency.date.getMonth() + 1 }/${ user.stages.lookingForAgency.date.getDate() }/${ user.stages.lookingForAgency.date.getFullYear() }`
			});
		}

		if( user.stages.workingWithAgency.started ) {
			userData.push({
				key: 'working with agency started',
				value: user.stages.workingWithAgency.started
			});
		}

		if( user.stages.workingWithAgency.date ) {
			userData.push({
				key: 'working with agency date',
				value: `${ user.stages.workingWithAgency.date.getMonth() + 1 }/${ user.stages.workingWithAgency.date.getDate() }/${ user.stages.workingWithAgency.date.getFullYear() }`
			});
		}

		if( user.stages.MAPPTrainingCompleted.started ) {
			userData.push({
				key: 'MAPP trainging completed',
				value: user.stages.MAPPTrainingCompleted.completed
			});
		}

		if( user.stages.MAPPTrainingCompleted.date ) {
			userData.push({
				key: 'MAPP trainging date',
				value: `${ user.stages.MAPPTrainingCompleted.date.getMonth() + 1 }/${ user.stages.MAPPTrainingCompleted.date.getDate() }/${ user.stages.MAPPTrainingCompleted.date.getFullYear() }`
			});
		}

		if( user.homestudy.completed ) {
			userData.push({
				key: 'homestudy completed',
				value: user.homestudy.completed
			});
		}

		if( user.homestudy.initialDate ) {
			userData.push({
				key: 'homestudy date',
				value: `${ user.homestudy.initialDate.getMonth() + 1 }/${ user.homestudy.initialDate.getDate() }/${ user.homestudy.initialDate.getFullYear() }`
			});
		}

		// family details
		userData.push({
			key: 'number of children currently in home',
			value: user.numberOfChildren
		});

		const numberOfChildrenInHome = user.numberOfChildren === '8+' ?
			8 :
			parseInt(user.numberOfChildren, 10);

		for( let i = 1; i <= numberOfChildrenInHome; i++) {
			if( user[ `child${ i }` ][ 'name' ] ) {
				userData.push({
					key: `child ${ i } name`,
					value: user[ `child${ i }` ][ 'name' ]
				});
			}

			if( user[ `child${ i }` ][ 'birthDate' ] ) {
				userData.push({
					key: `child ${ i } date of birth`,
					value: `${ user[ `child${ i }` ][ 'birthDate' ].getMonth() + 1 }/${ user[ `child${ i }` ][ 'birthDate' ].getDate() }/${ user[ `child${ i }` ][ 'birthDate' ].getFullYear() }`
				});
			}

			if( user[ `child${ i }` ][ 'gender' ] ) {
				userData.push({
					key: `child ${ i } gender`,
					value: user[ `child${ i }` ][ 'gender' ][ 'gender' ]
				});
			}

			if( user[ `child${ i }` ][ 'type' ] ) {
				userData.push({
					key: `child ${ i } type`,
					value: user[ `child${ i }` ][ 'type' ][ 'childType' ]
				});
			}
		}

		if( user.otherAdultsInHome.number ) {
			userData.push({
				key: 'number of other adults currently in home',
				value: user.otherAdultsInHome.number
			});
		}

		if( user.havePetsInHome ) {
			userData.push({
				key: 'has pets in home',
				value: user.havePetsInHome
			});
		}

		if( user.language && user.language.language ) {
			userData.push({
				key: 'primary language',
				value: user.language.language
			});
		}

		if( otherLanguagesArray.length !== 0 ) {
			userData.push({
				key: 'other languages',
				value: otherLanguagesArray.join( ', ' )
			});
		}

		// adoption preferences
		if( matchingPreferencesGenderArray.length !== 0 ) {
			userData.push({
				key: 'preferred gender',
				value: matchingPreferencesGenderArray.join( ', ' )
			});
		}

		if( matchingPreferencesLegalStatusArray.length !== 0 ) {
			userData.push({
				key: 'preferred legal status',
				value: matchingPreferencesLegalStatusArray.join( ', ' )
			});
		}

		if( user.matchingPreferences.adoptionAges.from ) {
			userData.push({
				key: 'preferred age from',
				value: user.matchingPreferences.adoptionAges.from
			});
		}

		if( user.matchingPreferences.adoptionAges.to ) {
			userData.push({
				key: 'preferred age to',
				value: user.matchingPreferences.adoptionAges.to
			});
		}

		if( user.matchingPreferences.minNumberOfChildrenToAdopt ) {
			userData.push({
				key: 'minimum number of children preferred',
				value: user.matchingPreferences.minNumberOfChildrenToAdopt
			});
		}

		if( user.matchingPreferences.maxNumberOfChildrenToAdopt ) {
			userData.push({
				key: 'maximum number of children preferred',
				value: user.matchingPreferences.maxNumberOfChildrenToAdopt
			});
		}

		if( user.matchingPreferences.siblingContact !== undefined ) {
			userData.push({
				key: 'biological sibling contact ok',
				value: user.matchingPreferences.siblingContact
			});
		}

		if( user.matchingPreferences.birthFamilyContact !== undefined ) {
			userData.push({
				key: 'biological family contact ok',
				value: user.matchingPreferences.birthFamilyContact
			});
		}

		if( matchingPreferencesRaceArray.length !== 0 ) {
			userData.push({
				key: 'preferred race',
				value: matchingPreferencesRaceArray.join( ', ' )
			});
		}

		if( user.matchingPreferences.maxNeeds.physical ) {
			userData.push({
				key: 'maximum physical needs',
				value: user.matchingPreferences.maxNeeds.physical
			});
		}

		if( user.matchingPreferences.maxNeeds.emotional ) {
			userData.push({
				key: 'maximum emotional needs',
				value: user.matchingPreferences.maxNeeds.emotional
			});
		}

		if( user.matchingPreferences.maxNeeds.intellectual ) {
			userData.push({
				key: 'maximum intellectual needs',
				value: user.matchingPreferences.maxNeeds.intellectual
			});
		}

		if( heardAboutMAREFromArray.length !== 0 ) {
			userData.push({
				key: 'heard about MARE from',
				value: heardAboutMAREFromArray.join( ', ' )
			});
		}

		if( user.heardAboutMAREOther ) {
			userData.push({
				key: 'heard about MARE from - other',
				value: user.heardAboutMAREOther
			});
		}

		if( mailingListNames.length > 0 ) {
			userData.push({
				key: 'mailing lists',
				value: mailingListNames.join( ', ' )
			});
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'register_new-user-notification-to-staff',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                userType: user.userType,
				userData,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: registrationStaffContact.email,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: `new ${ user.userType } registration`
			// callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending new family notification email to MARE` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new family notification email to MARE - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
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
			return reject( new Error( `sending of the email is disabled` ) );
		}

		if( !userEmail ) {
			return reject( new Error( `no user email was provided` ) );
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'register_account-verification-to-user',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                host,
				userType,
				verificationCode,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: userEmail,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: 'please verify your MARE account'
			// callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending account verification email to newly registered user` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending account verification email to newly registered user - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};
