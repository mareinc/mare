const keystone		= require( 'keystone' ),
	  userService	= require( './service_user' ),
	  listsService	= require( './service_lists' ),
	  childService	= require( './service_child' );

exports.createInquiry = ( { inquiry, user } ) => {
	// return a promise around creating the inquiry
	return new Promise( ( resolve, reject ) => {
		// if no inquiry object was received, abort execution and reject the promise
		if( !inquiry ) {
			console.error( 'error creating inquiry via website - no inquiry data received' );
			return reject();
		}
		// if we've received a child inquiry
		if( inquiry.interest === 'child info' ) {
			// attempt to create a new child inquiry
			let createChildInquiry = exports.createChildInquiry( { inquiry, user } );
			// resolve the promise if successful
			createChildInquiry.then( () => {
				resolve();
			})
			// if there was an error saving the inquiry
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error creating child inquiry via website - ${ err }` );
				reject();
			});
		// otherwise, if it's a general inquiry
		} else if (inquiry.interest === 'general info' ) {
			// attempt the create a new general inquiry
			let createGeneralInquiry = exports.createGeneralInquiry( { inquiry, user } );
			// resolve the promise if successful
			createGeneralInquiry.then( () => {
				resolve();
			})
			// if there was an error saving the inquiry
			.catch( err => {
				// log the error for debugging purposes and reject the promise
				console.error( `error creating general inquiry via website - ${ err }` );
				reject();
			});
		// otherwise, it's an unrecognized inquiry type and
		} else {
			// log the error for debugging purposes and reject the promise
			console.error( `error creating inquiry via website - invalid interest value ${ interest } ` );
			reject();
		}
	});
};

exports.createChildInquiry = ( { inquiry, user } ) => {
	// return a promise around the creation of the new child inquiry
	return new Promise( ( resolve, reject ) => {
		// extract the child registration numbers into an array for multiples, or as is if it's just one
		const targetChildren = inquiry.childRegistrationNumbers.includes( ',' )
							   ? inquiry.childRegistrationNumbers.replace( / /g, '' ).split( ',' )
							   : inquiry.childRegistrationNumbers;

		const isFamily			= user.userType === 'family',
			  isSocialWorker	= user.userType === 'social worker',
			  isSiteVisitor		= user.userType === 'site visitor';

		let fetchWebsiteBot		= userService.getUserByFullName( 'Website Bot', 'admin' ),
			fetchWebsiteSource 	= listsService.getSourceByName( 'MARE Web' ),
			fetchInquiryMethod	= listsService.getInquiryMethodByName( 'website' ),
			fetchChildren		= typeof targetChildren === 'string'
								  ? childService.getChildByRegistrationNumberNew( targetChildren )
								  : childService.getChildrenByRegistrationNumbersNew( targetChildren );
		
		Promise.all( [ fetchWebsiteBot, fetchWebsiteSource, fetchInquiryMethod, fetchChildren ] )
			.then( values => {
				// assign local variables to the values returned by the promises
				const [ websiteBot, websiteSource, inquiryMethod, children ] = values;

				const Inquiry = keystone.list( 'Inquiry' );

				let newInquiry = new Inquiry.model({

					takenBy: websiteBot.get( '_id' ),
					takenOn: new Date(),

					inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
					inquiryType: 'child inquiry',
					inquiryMethod: inquiryMethod.get( '_id' ),

					source: websiteSource,

					child: children,
					siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
					socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
					family: isFamily ? user.get( '_id' ) : undefined,
					onBehalfOfMAREFamily: true, // because we don't know, MARE staff will need to check the notes
					comments: inquiry.inquiry,

					agency: undefined, // TODO: Relationship.  Don't set, needs to be filled out by MARE staff, or we need to capture that info in the form
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
};

exports.createGeneralInquiry = ( { inquiry, user } ) => {
	// return a promise around the creation of the new general inquiry
	return new Promise( ( resolve, reject ) => {

		const isSiteVisitor		= user.userType === 'site visitor',
			  isFamily			= user.userType === 'family',
			  isSocialWorker	= user.userType === 'social worker';

		let fetchWebsiteBot		= userService.getUserByFullName( 'Website Bot', 'admin' ),
			fetchWebsiteSource 	= listsService.getSourceByName( 'MARE Web' ),
			fetchInquiryMethod	= listsService.getInquiryMethodByName( 'website' );
		
		Promise.all( [ fetchWebsiteBot, fetchWebsiteSource, fetchInquiryMethod ] ).then( values => {

			// assign local variables to the values returned by the promises
			const [ websiteBot, websiteSource, inquiryMethod ] = values;

			const Inquiry = keystone.list( 'Inquiry' );
			
			let newInquiry = new Inquiry.model({

				takenBy: websiteBot.get( '_id' ),
				takenOn: new Date(),

				inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
				inquiryType: 'general inquiry',
				inquiryMethod: inquiryMethod.get( '_id' ),

				source: websiteSource,

				siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
				socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
				family: isFamily ? user.get( '_id' ) : undefined,
				onBehalfOfMAREFamily: true, // because we don't know, MARE staff will need to check the notes
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
};