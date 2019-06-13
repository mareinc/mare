const Email = require( 'keystone-email' ),
      hbs = require( 'hbs' );

// TODO: several email functions in this file are nearly identical to those in user.registration-email.controllers.js.  They should be consolidated to keep it DRY
exports.sendNewSocialWorkerFamilyRegistrationNotificationEmailToMARE = ( socialWorkerName, rawFamilyData, family, registrationStaffContact, host ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_SOCIAL_WORKER_FAMILY_REGISTRATION_EMAILS_TO_MARE !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the new social worker family registration email to MARE staff is disabled` ) );
		}

		if( !registrationStaffContact ) {
			return reject( new Error( `no staff contact was provided` ) );
		}

		// arrays was used instead of a Maps because Mustache templates apparently can't handle Maps
		let familyData = [],
			additionalFamilyData = [],
			heardAboutMAREFromArray = [],
			contact1RaceArray = [],
			contact2RaceArray = [],
			otherLanguagesArray = [],
			matchingPreferencesGenderArray = [],
			matchingPreferencesLegalStatusArray = [],
			matchingPreferencesRaceArray = [];

		// loop through each way to hear about MARE model which was populated when the family model was fetched
		for( entry of family.heardAboutMAREFrom ) {
			// extract the text values associated with the model into the array
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// loop through each contact 1 race model which was populated when the family model was fetched
		for( entry of family.contact1.race ) {
			// extract the text values associated with the model into the array
			contact1RaceArray.push( entry.race );
		}
		// loop through each contact 2 race model which was populated when the family model was fetched
		for( entry of family.contact2.race ) {
			// extract the text values associated with the model into the array
			contact2RaceArray.push( entry.race );
		}
		// loop through each other language model which was populated when the family model was fetched
		for( entry of family.otherLanguages ) {
			// extract the text values associated with the model into the array
			otherLanguagesArray.push( entry.language );
		}
		// loop through each matching preferences gender model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.gender ) {
			// extract the text values associated with the model into the array
			matchingPreferencesGenderArray.push( entry.gender );
		}
		// loop through each matching preferences legal status model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.legalStatus ) {
			// extract the text values associated with the model into the array
			matchingPreferencesLegalStatusArray.push( entry.legalStatus );
		}
		// loop through each matching preferences race model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.race ) {
			// extract the text values associated with the model into the array
			matchingPreferencesRaceArray.push( entry.race );
		}
		// store only the fields that have been populated by the user
		if( family.email ) {
			familyData.push( {
				key: 'email',
				value: family.email
			});
		}

		// contact 1
		if( family.contact1.name.first ) {
			familyData.push( {
				key: 'contact 1 first name',
				value: family.contact1.name.first
			});
		}

		if( family.contact1.name.last ) {
			familyData.push( {
				key: 'contact 1 last name',
				value: family.contact1.name.last
			});
		}

		if( family.contact1.email ) {
			familyData.push( {
				key: 'contact 1 email',
				value: family.contact1.email
			});
		}

		if( family.contact1.phone.mobile ) {
			familyData.push( {
				key: 'contact 1 mobile phone',
				value: family.contact1.phone.mobile
			});
		}

		if( family.contact1.preferredCommunicationMethod ) {
			familyData.push( {
				key: 'contact 1 preferred communication method',
				value: family.contact1.preferredCommunicationMethod
			});
		}

		if( family.contact1.gender && family.contact1.gender.gender ) {
			familyData.push( {
				key: 'contact 1 gender',
				value: family.contact1.gender.gender
			});
		}

		if( contact1RaceArray.length !== 0 ) {
			familyData.push( {
				key: 'contact 1 race',
				value: contact1RaceArray.join( ', ' )
			});
		}

		if( family.contact1.occupation ) {
			familyData.push( {
				key: 'contact 1 occupation',
				value: family.contact1.occupation
			});
		}

		if( family.contact1.birthDate ) {
			familyData.push( {
				key: 'contact 1 date of birth',
				value: `${ family.contact1.birthDate.getMonth() + 1 }/${ family.contact1.birthDate.getDate() }/${ family.contact1.birthDate.getFullYear() }`
			});
		}

		// contact 2
		if( family.contact2.name.first ) {
			familyData.push( {
				key: 'contact 2 first name',
				value: family.contact2.name.first
			});
		}

		if( family.contact2.name.last ) {
			familyData.push( {
				key: 'contact 2 last name',
				value: family.contact2.name.last
			});
		}

		if( family.contact2.email ) {
			familyData.push( {
				key: 'contact 2 email',
				value: family.contact2.email
			});
		}

		if( family.contact2.phone.mobile ) {
			familyData.push( {
				key: 'contact 2 mobile phone',
				value: family.contact2.phone.mobile
			});
		}

		if( family.contact2.preferredCommunicationMethod ) {
			familyData.push( {
				key: 'contact 2 preferred communication method',
				value: family.contact2.preferredCommunicationMethod
			});
		}

		if( family.contact2.gender && family.contact2.gender.gender ) {
			familyData.push( {
				key: 'contact 2 gender',
				value: family.contact2.gender.gender
			});
		}

		if( contact2RaceArray.length !== 0 ) {
			familyData.push( {
				key: 'contact 2 race',
				value: contact2RaceArray.join( ', ' )
			});
		}

		if( family.contact2.occupation ) {
			familyData.push( {
				key: 'contact 2 occupation',
				value: family.contact2.occupation
			});
		}

		if( family.contact2.birthDate ) {
			familyData.push( {
				key: 'contact 2 date of birth',
				value: `${ family.contact2.birthDate.getMonth() + 1 }/${ family.contact2.birthDate.getDate() }/${ family.contact2.birthDate.getFullYear() }`
			});
		}

		if( family.address.street1 ) {
			familyData.push( {
				key: 'street 1',
				value: family.address.street1
			});
		}

		if( family.address.street2 ) {
			familyData.push( {
				key: 'street 2',
				value: family.address.street2
			});
		}

		if( !family.address.isOutsideMassachusetts && family.address.city.cityOrTown ) {
			familyData.push( {
				key: 'city',
				value: family.address.city.cityOrTown
			});
		}

		if( family.address.isOutsideMassachusetts && family.address.cityText ) {
			familyData.push( {
				key: 'city',
				value: family.address.cityText
			});
		}

		if( family.address.state.state ) {
			familyData.push( {
				key: 'state',
				value: family.address.state.state
			});
		}

		if( family.address.zipCode ) {
			familyData.push( {
				key: 'zip code',
				value: family.address.zipCode
			});
		}

		if( family.homePhone ) {
			familyData.push( {
				key: 'home phone',
				value: family.homePhone
			});
		}

		if( family.stages.gatheringInformation.started ) {
			familyData.push( {
				key: 'gathering information started',
				value: family.stages.gatheringInformation.started
			});
		}

		if( family.stages.gatheringInformation.date ) {
			familyData.push( {
				key: 'gathering information date',
				value: `${ family.stages.gatheringInformation.date.getMonth() + 1 }/${ family.stages.gatheringInformation.date.getDate() }/${ family.stages.gatheringInformation.date.getFullYear() }`
			});
		}

		if( family.stages.lookingForAgency.started ) {
			familyData.push( {
				key: 'looking for agency started',
				value: family.stages.lookingForAgency.started
			});
		}

		if( family.stages.lookingForAgency.date ) {
			familyData.push( {
				key: 'looking for agency date',
				value: `${ family.stages.lookingForAgency.date.getMonth() + 1 }/${ family.stages.lookingForAgency.date.getDate() }/${ family.stages.lookingForAgency.date.getFullYear() }`
			});
		}

		if( family.stages.workingWithAgency.started ) {
			familyData.push( {
				key: 'working with agency started',
				value: family.stages.workingWithAgency.started
			});
		}

		if( family.stages.workingWithAgency.date ) {
			familyData.push( {
				key: 'working with agency date',
				value: `${ family.stages.workingWithAgency.date.getMonth() + 1 }/${ family.stages.workingWithAgency.date.getDate() }/${ family.stages.workingWithAgency.date.getFullYear() }`
			});
		}

		if( family.stages.MAPPTrainingCompleted.started ) {
			familyData.push( {
				key: 'MAPP trainging completed',
				value: family.stages.MAPPTrainingCompleted.completed
			});
		}

		if( family.stages.MAPPTrainingCompleted.date ) {
			familyData.push( {
				key: 'MAPP trainging date',
				value: `${ family.stages.MAPPTrainingCompleted.date.getMonth() + 1 }/${ family.stages.MAPPTrainingCompleted.date.getDate() }/${ family.stages.MAPPTrainingCompleted.date.getFullYear() }`
			});
		}

		if( family.homestudy.completed ) {
			familyData.push( {
				key: 'homestudy completed',
				value: family.homestudy.completed
			});
		}

		if( family.homestudy.initialDate ) {
			familyData.push( {
				key: 'homestudy date',
				value: `${ family.homestudy.initialDate.getMonth() + 1 }/${ family.homestudy.initialDate.getDate() }/${ family.homestudy.initialDate.getFullYear() }`
			});
		}

		// family details
		familyData.push( {
			key: 'number of children currently in home',
			value: family.numberOfChildren
		});

		const numberOfChildrenInHome = family.numberOfChildren === '8+' ?
										8 :
										parseInt( family.numberOfChildren, 10 );

		for( let i = 1; i <= numberOfChildrenInHome; i++ ) {
			if( family[ `child${ i }` ][ 'name' ] ) {
				familyData.push( {
					key: `child ${ i } name`,
					value: family[ `child${ i }` ][ 'name' ]
				});
			}

			if( family[ `child${ i }` ][ 'birthDate' ] ) {
				familyData.push( {
					key: `child ${ i } date of birth`,
					value: `${ family[ `child${ i }` ][ 'birthDate' ].getMonth() + 1 }/${ family[ `child${ i }` ][ 'birthDate' ].getDate() }/${ family[ `child${ i }` ][ 'birthDate' ].getFullYear() }`
				});
			}

			if( family[ `child${ i }` ][ 'gender' ] ) {
				familyData.push( {
					key: `child ${ i } gender`,
					value: family[ `child${ i }` ][ 'gender' ][ 'gender' ]
				});
			}

			if( family[ `child${ i }` ][ 'type' ] ) {
				familyData.push( {
					key: `child ${ i } type`,
					value: family[ `child${ i }` ][ 'type' ][ 'childType']
				});
			}
		}

		if( family.otherAdultsInHome.number ) {
			familyData.push( {
				key: 'number of other adults currently in home',
				value: family.otherAdultsInHome.number
			});
		}

		if( family.havePetsInHome ) {
			familyData.push( {
				key: 'has pets in home',
				value: family.havePetsInHome
			});
		}

		if( family.language && family.language.language ) {
			familyData.push( {
				key: 'primary language',
				value: family.language.language
			});
		}

		if( otherLanguagesArray.length !== 0 ) {
			familyData.push( {
				key: 'other languages',
				value: otherLanguagesArray.join( ', ' )
			});
		}

		// adoption preferences
		if( matchingPreferencesGenderArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred gender',
				value: matchingPreferencesGenderArray.join( ', ' )
			});
		}

		if( matchingPreferencesLegalStatusArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred legal status',
				value: matchingPreferencesLegalStatusArray.join( ', ' )
			});
		}

		if( family.matchingPreferences.adoptionAges.from ) {
			familyData.push( {
				key: 'preferred age from',
				value: family.matchingPreferences.adoptionAges.from
			});
		}

		if( family.matchingPreferences.adoptionAges.to ) {
			familyData.push( {
				key: 'preferred age to',
				value: family.matchingPreferences.adoptionAges.to
			});
		}

		if( family.matchingPreferences.minNumberOfChildrenToAdopt ) {
			familyData.push( {
				key: 'minimum number of children preferred',
				value: family.matchingPreferences.minNumberOfChildrenToAdopt
			});
		}

		if( family.matchingPreferences.maxNumberOfChildrenToAdopt ) {
			familyData.push( {
				key: 'maximum number of children preferred',
				value: family.matchingPreferences.maxNumberOfChildrenToAdopt
			});
		}

		if( family.matchingPreferences.siblingContact !== undefined ) {
			familyData.push( {
				key: 'biological sibling contact ok',
				value: family.matchingPreferences.siblingContact
			});
		}

		if( family.matchingPreferences.birthFamilyContact !== undefined ) {
			familyData.push( {
				key: 'biological family contact ok',
				value: family.matchingPreferences.birthFamilyContact
			});
		}

		if( matchingPreferencesRaceArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred race',
				value: matchingPreferencesRaceArray.join( ', ' )
			});
		}

		if( family.matchingPreferences.maxNeeds.physical ) {
			familyData.push( {
				key: 'maximum physical needs',
				value: family.matchingPreferences.maxNeeds.physical
			});
		}

		if( family.matchingPreferences.maxNeeds.emotional ) {
			familyData.push( {
				key: 'maximum emotional needs',
				value: family.matchingPreferences.maxNeeds.emotional
			});
		}

		if( family.matchingPreferences.maxNeeds.intellectual ) {
			familyData.push( {
				key: 'maximum intellectual needs',
				value: family.matchingPreferences.maxNeeds.intellectual
			});
		}

		if( heardAboutMAREFromArray.length !== 0 ) {
			familyData.push( {
				key: 'heard about MARE from',
				value: heardAboutMAREFromArray.join( ', ' )
			});
		}

		if( family.heardAboutMAREOther ) {
			familyData.push( {
				key: 'heard about MARE from - other',
				value: family.heardAboutMAREOther
			});
		}

		if( rawFamilyData.socialWorkerName ) {
			additionalFamilyData.push( {
				key: 'social worker name',
				value: rawFamilyData.socialWorkerName
			})
		}

		if( rawFamilyData.socialWorkerEmail ) {
			additionalFamilyData.push( {
				key: 'social worker email',
				value: rawFamilyData.socialWorkerEmail
			})
		}

		if( rawFamilyData.socialWorkerPhone ) {
			additionalFamilyData.push( {
				key: 'social worker phone',
				value: rawFamilyData.socialWorkerPhone
			})
		}

		if( rawFamilyData.socialWorkerAgency ) {
			additionalFamilyData.push( {
				key: 'social worker agency',
				value: rawFamilyData.socialWorkerAgency
			})
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'social-worker-new-family-notification-to-mare',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                socialWorkerName,
				familyData,
				additionalFamilyData,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: registrationStaffContact.email,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: `new social worker family registration`
            // callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending new social worker family registration notification email to MARE` ) );
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

// TODO: the bulk of this function is repeated in the function above as well as in user.registration-email.controllers.js.  It should be consolodated to keep it DRY
exports.sendNewSocialWorkerFamilyRegistrationNotificationEmailToSocialWorker = ( socialWorkerName, rawFamilyData, family, socialWorkerEmail, host ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_SOCIAL_WORKER_FAMILY_REGISTRATION_EMAILS_TO_SOCIAL_WORKER !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the new social worker family registration notification email to social workers is disabled` ) );
		}

		if( !socialWorkerEmail ) {
			return reject( new Error( `no social worker email was provided` ) );
		}
		// arrays was used instead of a Maps because Mustache templates apparently can't handle Maps
		let familyData = [],
			additionalFamilyData = [],
			heardAboutMAREFromArray = [],
			contact1RaceArray = [],
			contact2RaceArray = [],
			otherLanguagesArray = [],
			matchingPreferencesGenderArray = [],
			matchingPreferencesLegalStatusArray = [],
			matchingPreferencesRaceArray = [];

		// loop through each way to hear about MARE model which was populated when the family model was fetched
		for( entry of family.heardAboutMAREFrom ) {
			// extract the text values associated with the model into the array
			heardAboutMAREFromArray.push( entry.wayToHearAboutMARE );
		}
		// loop through each contact 1 race model which was populated when the family model was fetched
		for( entry of family.contact1.race ) {
			// extract the text values associated with the model into the array
			contact1RaceArray.push( entry.race );
		}
		// loop through each contact 2 race model which was populated when the family model was fetched
		for( entry of family.contact2.race ) {
			// extract the text values associated with the model into the array
			contact2RaceArray.push( entry.race );
		}
		// loop through each other language model which was populated when the family model was fetched
		for( entry of family.otherLanguages ) {
			// extract the text values associated with the model into the array
			otherLanguagesArray.push( entry.language );
		}
		// loop through each matching preferences gender model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.gender ) {
			// extract the text values associated with the model into the array
			matchingPreferencesGenderArray.push( entry.gender );
		}
		// loop through each matching preferences legal status model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.legalStatus ) {
			// extract the text values associated with the model into the array
			matchingPreferencesLegalStatusArray.push( entry.legalStatus );
		}
		// loop through each matching preferences race model which was populated when the family model was fetched
		for( entry of family.matchingPreferences.race ) {
			// extract the text values associated with the model into the array
			matchingPreferencesRaceArray.push( entry.race );
		}
		// store only the fields that have been populated by the user
		if( family.email ) {
			familyData.push( {
				key: 'email',
				value: family.email
			});
		}

		// contact 1
		if( family.contact1.name.first ) {
			familyData.push( {
				key: 'contact 1 first name',
				value: family.contact1.name.first
			});
		}

		if( family.contact1.name.last ) {
			familyData.push( {
				key: 'contact 1 last name',
				value: family.contact1.name.last
			});
		}

		if( family.contact1.email ) {
			familyData.push( {
				key: 'contact 1 email',
				value: family.contact1.email
			});
		}

		if( family.contact1.phone.mobile ) {
			familyData.push( {
				key: 'contact 1 mobile phone',
				value: family.contact1.phone.mobile
			});
		}

		if( family.contact1.preferredCommunicationMethod ) {
			familyData.push( {
				key: 'contact 1 preferred communication method',
				value: family.contact1.preferredCommunicationMethod
			});
		}

		if( family.contact1.gender && family.contact1.gender.gender ) {
			familyData.push( {
				key: 'contact 1 gender',
				value: family.contact1.gender.gender
			});
		}

		if( contact1RaceArray.length !== 0 ) {
			familyData.push( {
				key: 'contact 1 race',
				value: contact1RaceArray.join( ', ' )
			});
		}

		if( family.contact1.occupation ) {
			familyData.push( {
				key: 'contact 1 occupation',
				value: family.contact1.occupation
			});
		}

		if( family.contact1.birthDate ) {
			familyData.push( {
				key: 'contact 1 date of birth',
				value: `${ family.contact1.birthDate.getMonth() + 1 }/${ family.contact1.birthDate.getDate() }/${ family.contact1.birthDate.getFullYear() }`
			});
		}

		// contact 2
		if( family.contact2.name.first ) {
			familyData.push( {
				key: 'contact 2 first name',
				value: family.contact2.name.first
			});
		}

		if( family.contact2.name.last ) {
			familyData.push( {
				key: 'contact 2 last name',
				value: family.contact2.name.last
			});
		}

		if( family.contact2.email ) {
			familyData.push( {
				key: 'contact 2 email',
				value: family.contact2.email
			});
		}

		if( family.contact2.phone.mobile ) {
			familyData.push( {
				key: 'contact 2 mobile phone',
				value: family.contact2.phone.mobile
			});
		}

		if( family.contact2.preferredCommunicationMethod ) {
			familyData.push( {
				key: 'contact 2 preferred communication method',
				value: family.contact2.preferredCommunicationMethod
			});
		}

		if( family.contact2.gender && family.contact2.gender.gender ) {
			familyData.push( {
				key: 'contact 2 gender',
				value: family.contact2.gender.gender
			});
		}

		if( contact2RaceArray.length !== 0 ) {
			familyData.push( {
				key: 'contact 2 race',
				value: contact2RaceArray.join( ', ' )
			});
		}

		if( family.contact2.occupation ) {
			familyData.push( {
				key: 'contact 2 occupation',
				value: family.contact2.occupation
			});
		}

		if( family.contact2.birthDate ) {
			familyData.push( {
				key: 'contact 2 date of birth',
				value: `${ family.contact2.birthDate.getMonth() + 1 }/${ family.contact2.birthDate.getDate() }/${ family.contact2.birthDate.getFullYear() }`
			});
		}

		if( family.address.street1 ) {
			familyData.push( {
				key: 'street 1',
				value: family.address.street1
			});
		}

		if( family.address.street2 ) {
			familyData.push( {
				key: 'street 2',
				value: family.address.street2
			});
		}

		if( !family.address.isOutsideMassachusetts && family.address.city.cityOrTown ) {
			familyData.push( {
				key: 'city',
				value: family.address.city.cityOrTown
			});
		}

		if( family.address.isOutsideMassachusetts && family.address.cityText ) {
			familyData.push( {
				key: 'city',
				value: family.address.cityText
			});
		}

		if( family.address.state.state ) {
			familyData.push( {
				key: 'state',
				value: family.address.state.state
			});
		}

		if( family.address.zipCode ) {
			familyData.push( {
				key: 'zip code',
				value: family.address.zipCode
			});
		}

		if( family.homePhone ) {
			familyData.push( {
				key: 'home phone',
				value: family.homePhone
			});
		}

		if( family.stages.gatheringInformation.started ) {
			familyData.push( {
				key: 'gathering information started',
				value: family.stages.gatheringInformation.started
			});
		}

		if( family.stages.gatheringInformation.date ) {
			familyData.push( {
				key: 'gathering information date',
				value: `${ family.stages.gatheringInformation.date.getMonth() + 1 }/${ family.stages.gatheringInformation.date.getDate() }/${ family.stages.gatheringInformation.date.getFullYear() }`
			});
		}

		if( family.stages.lookingForAgency.started ) {
			familyData.push( {
				key: 'looking for agency started',
				value: family.stages.lookingForAgency.started
			});
		}

		if( family.stages.lookingForAgency.date ) {
			familyData.push( {
				key: 'looking for agency date',
				value: `${ family.stages.lookingForAgency.date.getMonth() + 1 }/${ family.stages.lookingForAgency.date.getDate() }/${ family.stages.lookingForAgency.date.getFullYear() }`
			});
		}

		if( family.stages.workingWithAgency.started ) {
			familyData.push( {
				key: 'working with agency started',
				value: family.stages.workingWithAgency.started
			});
		}

		if( family.stages.workingWithAgency.date ) {
			familyData.push( {
				key: 'working with agency date',
				value: `${ family.stages.workingWithAgency.date.getMonth() + 1 }/${ family.stages.workingWithAgency.date.getDate() }/${ family.stages.workingWithAgency.date.getFullYear() }`
			});
		}

		if( family.stages.MAPPTrainingCompleted.started ) {
			familyData.push( {
				key: 'MAPP trainging completed',
				value: family.stages.MAPPTrainingCompleted.completed
			});
		}

		if( family.stages.MAPPTrainingCompleted.date ) {
			familyData.push( {
				key: 'MAPP trainging date',
				value: `${ family.stages.MAPPTrainingCompleted.date.getMonth() + 1 }/${ family.stages.MAPPTrainingCompleted.date.getDate() }/${ family.stages.MAPPTrainingCompleted.date.getFullYear() }`
			});
		}

		if( family.homestudy.completed ) {
			familyData.push( {
				key: 'homestudy completed',
				value: family.homestudy.completed
			});
		}

		if( family.homestudy.initialDate ) {
			familyData.push( {
				key: 'homestudy date',
				value: `${ family.homestudy.initialDate.getMonth() + 1 }/${ family.homestudy.initialDate.getDate() }/${ family.homestudy.initialDate.getFullYear() }`
			});
		}

		// family details
		familyData.push( {
			key: 'number of children currently in home',
			value: family.numberOfChildren
		});

		const numberOfChildrenInHome = family.numberOfChildren === '8+' ?
										8 :
										parseInt( family.numberOfChildren, 10 );

		for( let i = 1; i <= numberOfChildrenInHome; i++ ) {
			if( family[ `child${ i }` ][ 'name' ] ) {
				familyData.push( {
					key: `child ${ i } name`,
					value: family[ `child${ i }` ][ 'name' ]
				});
			}

			if( family[ `child${ i }` ][ 'birthDate' ] ) {
				familyData.push( {
					key: `child ${ i } date of birth`,
					value: `${ family[ `child${ i }` ][ 'birthDate' ].getMonth() + 1 }/${ family[ `child${ i }` ][ 'birthDate' ].getDate() }/${ family[ `child${ i }` ][ 'birthDate' ].getFullYear() }`
				});
			}

			if( family[ `child${ i }` ][ 'gender' ] ) {
				familyData.push( {
					key: `child ${ i } gender`,
					value: family[ `child${ i }` ][ 'gender' ][ 'gender' ]
				});
			}

			if( family[ `child${ i }` ][ 'type' ] ) {
				familyData.push( {
					key: `child ${ i } type`,
					value: family[ `child${ i }` ][ 'type' ][ 'childType']
				});
			}
		}

		if( family.otherAdultsInHome.number ) {
			familyData.push( {
				key: 'number of other adults currently in home',
				value: family.otherAdultsInHome.number
			});
		}

		if( family.havePetsInHome ) {
			familyData.push( {
				key: 'has pets in home',
				value: family.havePetsInHome
			});
		}

		if( family.language && family.language.language ) {
			familyData.push( {
				key: 'primary language',
				value: family.language.language
			});
		}

		if( otherLanguagesArray.length !== 0 ) {
			familyData.push( {
				key: 'other languages',
				value: otherLanguagesArray.join( ', ' )
			});
		}

		// adoption preferences
		if( matchingPreferencesGenderArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred gender',
				value: matchingPreferencesGenderArray.join( ', ' )
			});
		}

		if( matchingPreferencesLegalStatusArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred legal status',
				value: matchingPreferencesLegalStatusArray.join( ', ' )
			});
		}

		if( family.matchingPreferences.adoptionAges.from ) {
			familyData.push( {
				key: 'preferred age from',
				value: family.matchingPreferences.adoptionAges.from
			});
		}

		if( family.matchingPreferences.adoptionAges.to ) {
			familyData.push( {
				key: 'preferred age to',
				value: family.matchingPreferences.adoptionAges.to
			});
		}

		if( family.matchingPreferences.minNumberOfChildrenToAdopt ) {
			familyData.push( {
				key: 'minimum number of children preferred',
				value: family.matchingPreferences.minNumberOfChildrenToAdopt
			});
		}

		if( family.matchingPreferences.maxNumberOfChildrenToAdopt ) {
			familyData.push( {
				key: 'maximum number of children preferred',
				value: family.matchingPreferences.maxNumberOfChildrenToAdopt
			});
		}

		if( family.matchingPreferences.siblingContact !== undefined ) {
			familyData.push( {
				key: 'biological sibling contact ok',
				value: family.matchingPreferences.siblingContact
			});
		}

		if( family.matchingPreferences.birthFamilyContact !== undefined ) {
			familyData.push( {
				key: 'biological family contact ok',
				value: family.matchingPreferences.birthFamilyContact
			});
		}

		if( matchingPreferencesRaceArray.length !== 0 ) {
			familyData.push( {
				key: 'preferred race',
				value: matchingPreferencesRaceArray.join( ', ' )
			});
		}

		if( family.matchingPreferences.maxNeeds.physical ) {
			familyData.push( {
				key: 'maximum physical needs',
				value: family.matchingPreferences.maxNeeds.physical
			});
		}

		if( family.matchingPreferences.maxNeeds.emotional ) {
			familyData.push( {
				key: 'maximum emotional needs',
				value: family.matchingPreferences.maxNeeds.emotional
			});
		}

		if( family.matchingPreferences.maxNeeds.intellectual ) {
			familyData.push( {
				key: 'maximum intellectual needs',
				value: family.matchingPreferences.maxNeeds.intellectual
			});
		}

		if( heardAboutMAREFromArray.length !== 0 ) {
			familyData.push( {
				key: 'heard about MARE from',
				value: heardAboutMAREFromArray.join( ', ' )
			});
		}

		if( family.heardAboutMAREOther ) {
			familyData.push( {
				key: 'heard about MARE from - other',
				value: family.heardAboutMAREOther
			});
		}

		if( rawFamilyData.socialWorkerName ) {
			additionalFamilyData.push( {
				key: 'social worker name',
				value: rawFamilyData.socialWorkerName
			})
		}

		if( rawFamilyData.socialWorkerEmail ) {
			additionalFamilyData.push( {
				key: 'social worker email',
				value: rawFamilyData.socialWorkerEmail
			})
		}

		if( rawFamilyData.socialWorkerPhone ) {
			additionalFamilyData.push( {
				key: 'social worker phone',
				value: rawFamilyData.socialWorkerPhone
			})
		}

		if( rawFamilyData.socialWorkerAgency ) {
			additionalFamilyData.push( {
				key: 'social worker agency',
				value: rawFamilyData.socialWorkerAgency
			})
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'social-worker-new-family-notification-to-social-worker',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                familyName: family.displayName,
				familyData,
				additionalFamilyData,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: socialWorkerEmail,
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: `family registration details`
            // callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending new social worker family registration notification email to social worker ${ socialWorkerName }` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new family notification email to social worker - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};

exports.sendNewSocialWorkerFamilyRegistrationNotificationEmailToFamily = ( rawFamilyData, family, registrationStaffContact, host, verificationCode ) => {

	return new Promise( ( resolve, reject ) => {
		// if sending of the email is not currently allowed
		if( process.env.SEND_SOCIAL_WORKER_FAMILY_REGISTRATION_EMAILS_TO_FAMILY !== 'true' ) {
			// reject the promise with information about why
			return reject( new Error( `sending of the new social worker family registration notification email to families is disabled` ) );
		}

		if( !registrationStaffContact ) {
			return reject( new Error( `no staff contact was provided` ) );
		}

		// find the email template in templates/emails/
		Email.send(
			// template path
            'social-worker-new-family-notification-to-social-worker',
            // email options
            {
                engine: 'hbs',
                transport: 'mandrill',
                root: 'templates/emails/'
            // render options
            }, {
                rawFamilyData,
				family,
				host,
				verificationCode,
                layout: false
            // send options
            }, {
                apiKey: process.env.MANDRILL_APIKEY,
                to: family.get( 'email' ),
				from: {
					name: 'MARE',
					email: 'communications@mareinc.org' // TODO: this should be in a model or ENV variable
				},
				subject: 'a MARE account has been created for you'
            // callback
			}, ( err, message ) => {
				// if there was an error sending the email
				if( err ) {
					// reject the promise with details
					return reject( new Error( `error sending new social worker family registration notification email to family ${ family.get( 'displayName' ) }` ) );
				}
				// the response object is stored as the 0th element of the returned message
				const response = message ? message[ 0 ] : undefined;
				// if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
				if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
					// reject the promise with details
					return reject( new Error( `error sending new family notification email to family ${ family.get( 'displayName' ) } - ${ response.status } - ${ response.email } - ${ response.reject_reason }` ) );
				}

				resolve();
			});
	});
};
