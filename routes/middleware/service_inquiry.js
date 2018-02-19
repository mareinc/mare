const keystone					= require( 'keystone' ),
	  Inquiry					= keystone.list( 'Inquiry' ),
	  moment					= require( 'moment' ),
	  userService				= require( './service_user' ),
	  listsService				= require( './service_lists' ),
	  childService				= require( './service_child' ),
	  emailTargetService		= require( './service_email-target' ),
	  staffEmailContactService	= require( './service_staff-email-contact' ),
	  inquiryEmailService		= require( './emails_inquiry' );

/* public - creates an inquiry from data submitted through the information request form on the website */
exports.createInquiry = ( { inquiry, user } ) => {
	// return a promise around creating the inquiry
	return new Promise( ( resolve, reject ) => {
		// if no inquiry object was received, abort execution and reject the promise
		if( !inquiry ) {
			// reject the promise with details of the error
			return reject( `no inquiry data received` );
		}

		// create variables to store the inquiry and inquirer data
		let newInquiry,
			inquiryData,
			inquirerData;

		// set default information for a staff email contact in case the real contact info can't be fetched
		let staffEmail = 'web@mareinc.org';

		// begin any asynchronous actions we can to speed up processing
		// fetch the email target model matching 'child inquiry'
		const fetchEmailTarget = emailTargetService.getEmailTargetByName( 'child inquiry' );
		// fetch the relevant inquirer data to populate the email
		const fetchInquirerData = extractInquirerData( user );
		// create a variable to hold the promise for creating the inquiry
		let createInquiry;

		// if we've received a child inquiry
		if( inquiry.interest === 'child info' ) {
			// attempt to create a new child inquiry
			createInquiry = saveChildInquiry( { inquiry, user } );
		// if we've received a general inquiry
		} else if (inquiry.interest === 'general info' ) {
			// attempt to create the new general inquiry
			createInquiry = saveGeneralInquiry( { inquiry, user } );
		// otherwise, it's an unrecognized inquiry type and
		} else {
			// reject the promise with details of the error
			return reject( `invalid interest value ${ interest }` );
		}

		createInquiry
			// if the inquiry saved successfully
			.then( inquiry => {
				// store the inquiry model in a variable for future processing
				newInquiry = inquiry;
				// resolve the promise with the new inquiry model
				resolve( newInquiry );
			})
			// if there was an error saving the inquiry
			.catch( err => {
				// reject the promise with details of the error
				reject( `error saving inquiry - ${ err }` );
			})
			// extract only the relevant fields from the inquiry
			.then( () => extractInquiryData( newInquiry ) )
			// store the data in a variable for future processing
			.then( data => inquiryData = data )
			// if the inquiry data was not populated correctly, log the error
			.catch( err => console.error( `error populating inquiry data for new inquiry staff email - inquiry id ${ newInquiry.get( '_id' ) } - ${ err }` ) )
			// extract only the relevant fields from the inquirer
			.then( () => fetchInquirerData )
			// store the data in a variable for future processing
			.then( data => inquirerData = data )
			// if the inquirer data was not populated correctly, log the error
			.catch( err => console.error( `error populating inquirer data for new inquiry staff email - inquiry id ${ newInquiry.get( '_id' ) } - ${ err }` ) )
			// extract the staff email contact for child inquiries
			.then( () => fetchEmailTarget )
			// fetch contact info for the staff email contact for child inquiries
			.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
			// overwrite the default contact details with the returned staff email
			.then( contact => staffEmail = contact.staffEmailContact.email )
			// if there was an error fetching the staff email contact, log the error
			.catch( err => console.error( `error fetching email contact for child inquiry submission, default contact info will be used instead - ${ err }` ) )		
			// send a notification email to MARE staff
			.then( () => {
				return inquiryEmailService.sendNewInquiryEmailToMARE( { inquiryData, inquirerData, staffEmail } ) } )
			// if there was an error sending the email to MARE staff, log the error with details about what went wrong
			.catch( err => console.error( `error sending new inquiry email to MARE contact about inquiry with id ${ newInquiry.get( '_id' ) } - ${ err }` ) );
	});
}

/* private - creates a child inquiry and saves it to the database */
function saveChildInquiry( { inquiry, user } ) {
	// return a promise around the creation of the new child inquiry
	return new Promise( ( resolve, reject ) => {
		// extract the child registration numbers into an array
		const targetChildren = inquiry.childRegistrationNumbers.includes( ',' )
							 ? inquiry.childRegistrationNumbers.replace( /\s/g, '' ).split( ',' )
							 : [ inquiry.childRegistrationNumbers ];

		const isFamily			= user.userType === 'family',
			  isSocialWorker	= user.userType === 'social worker',
			  isSiteVisitor		= user.userType === 'site visitor';

		let fetchWebsiteBot		= userService.getUserByFullName( 'Website Bot', 'admin' ),
			fetchInquiryMethod	= listsService.getInquiryMethodByName( 'website' ),
			fetchChildren		= childService.getChildrenByRegistrationNumbersNew( targetChildren );
		
		Promise.all( [ fetchWebsiteBot, fetchInquiryMethod, fetchChildren ] )
			.then( values => {
				// assign local variables to the values returned by the promises
				const [ websiteBot, inquiryMethod, children ] = values;

				let newInquiry = new Inquiry.model({

					takenBy: websiteBot.get( '_id' ),
					takenOn: new Date(),

					inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
					inquiryType: 'child inquiry',
					inquiryMethod: inquiryMethod.get( '_id' ),

					isSourceUnlisted: true,
					sourceText: inquiry.source,

					children: children.map( child => child.get( '_id' ) ),
					siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
					socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
					family: isFamily ? user.get( '_id' ) : undefined,
					onBehalfOfMAREFamily: isSocialWorker, // we assume true if they are a social worker because we don't know, MARE staff will need to check the notes
					comments: inquiry.inquiry
				});

				newInquiry.save( ( err, model ) => {
					// if there was an issue saving the new inquiry
					if( err ) {
						// reject the promise with information about the error
						return reject( `error saving inquiry model - ${ err }` );
					}
					// if the inquiry was saved successfully, resolve the promise with the newly saved inquiry model
					resolve( model );
				});
			})
			.catch( err => {
				// reject the promise with information about the error
				reject( err );
			});
	});
}

/* private - creates a general inquiry and saves it to the database */
function saveGeneralInquiry( { inquiry, user } ) {
	// return a promise around the creation of the new general inquiry
	return new Promise( ( resolve, reject ) => {

		const isSiteVisitor		= user.userType === 'site visitor',
			  isFamily			= user.userType === 'family',
			  isSocialWorker	= user.userType === 'social worker';

		let fetchWebsiteBot		= userService.getUserByFullName( 'Website Bot', 'admin' ),
			fetchInquiryMethod	= listsService.getInquiryMethodByName( 'website' );
		
		Promise.all( [ fetchWebsiteBot, fetchInquiryMethod ] ).then( values => {

			// assign local variables to the values returned by the promises
			const [ websiteBot, inquiryMethod ] = values;

			const Inquiry = keystone.list( 'Inquiry' );
			
			let newInquiry = new Inquiry.model({

				takenBy: websiteBot.get( '_id' ),
				takenOn: new Date(),

				inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
				inquiryType: 'general inquiry',
				inquiryMethod: inquiryMethod.get( '_id' ),

				isSourceUnlisted: true,
				sourceText: inquiry.source,

				siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
				socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
				family: isFamily ? user.get( '_id' ) : undefined,
				onBehalfOfMAREFamily: isSocialWorker, // we assume true if they are a social worker because we don't know, MARE staff will need to check the notes
				comments: inquiry.inquiry,

				agencyReferrals: undefined, // TODO: Relationship.  Don't set, needs to be filled out by MARE staff, or we need to capture that info in the form
			});

			newInquiry.save( ( err, model ) => {
				// if there was an issue saving the new inquiry
				if( err ) {
					// reject the promise with information about the error
					return reject( `error saving inquiry model - ${ err }` );
				}
				// if the inquiry was saved successfully, resolve the promise with the newly saved inquiry model
				resolve( model );
			});
		})
		.catch( err => {
			// reject the promise with information about the error
			reject( err );
		});
	});
}

/* private - extracts inquiry data needed to populate the notification email to the MARE staff email contact */
function extractInquiryData( inquiry ) {

	return new Promise( ( resolve, reject ) => {
		// if no inquiry was passed in
		if( !inquiry ) {
			// reject the promise with details of the error and prevent further code from executing
			return reject( `no inquiry provided` );
		}
		// set the fields to populate on the inquiry model
		const fieldsToPopulate = [
			'inquiryMethod', 'source', 'children', 'childsSocialWorker',
			'family', 'onBehalfOfFamily', 'agency', 'agencyReferrals' ];

		// populate fields on the inquiry model
		inquiry.populate( fieldsToPopulate, err => {
			// if there was an error populating the specified fields
			if ( err ) {
				// reject the promise with details about the error
				return reject( `error populating fields for inquiry with id ${ inquiry.get( '_id' ) }` );
			}

			// fill in all immediately available information
			const relevantData = {
				agency: inquiry.agency ? inquiry.agency.code : undefined,
				children: inquiry.children ?
						  inquiry.children.map( child => {
							  return {
								  nameAndRegistrationNumber: child.displayNameAndRegistration,
								  photolistingPage: child.photolistingPageNumber } } ) :
						  undefined,
				childsSocialWorker: inquiry.childsSocialWorker ? inquiry.childsSocialWorker.name.full : undefined,
				comments: inquiry.comments.trim(),
				family: inquiry.family ? inquiry.family.displayNameAndRegistration : undefined,
				inquirer: inquiry.inquirer,
				inquiryMethod: inquiry.inquiryMethod ? inquiry.inquiryMethod.inquiryMethod : undfined,
				inquiryType: inquiry.inquiryType,
				isOnBehalfOfMAREFamily: inquiry.onBehalfOfMAREFamily ? 'yes' : 'no',
				source: inquiry.sourceText.trim(),
				takenBy: 'Website Bot',
				takenOn: inquiry.takenOn ? moment( inquiry.takenOn ).format( 'MM/DD/YYYY' ) : undefined
			};
			// resolve the promise with the relevant inquiry data
			resolve( relevantData );
		});
	});
}

/* private - extracts user data needed to populate the notification email to the MARE staff email contact */
function extractInquirerData( inquirer ) {

	return new Promise( ( resolve, reject ) => {
		// if no inquirer was passed in
		if( !inquirer ) {
			// reject the promise with details of the error and prevent further code from executing
			return reject( `no inquirer provided` );
		}

		// populate fields on the inquirer model
		inquirer.populate( 'address.state', err => {
			// if there was an error populating the specified fields
			if ( err ) {
				// reject the promise with details about the error
				return resolve( `error populating fields for inquirer with id ${ inquirer.get( '_id' ) }` );
			}

			const relevantData = {
				name: inquirer.userType === 'family' ? inquirer.displayName : inquirer.name.full,
				street1: inquirer.address ? inquirer.address.street1 : undefined,
				street2: inquirer.address ? inquirer.address.street2 : undefined,
				city: inquirer.address ? inquirer.address.displayCity : undefined,
				state: inquirer.address ? inquirer.address.state.abbreviation : undefined,
				zipCode: inquirer.address ? inquirer.address.zipCode : undefined,
				mobilePhone: inquirer.userType === 'family' ? inquirer.contact1.phone.mobile : inquirer.phone.mobile,
				workPhone: inquirer.userType === 'family' ? inquirer.contact1.phone.work : inquirer.phone.work
			}
			// resolve the promise with the relevant inquirer data
			resolve( relevantData );
		});
	});
}