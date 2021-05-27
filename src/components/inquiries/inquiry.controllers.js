const keystone					= require( 'keystone' ),
	  Inquiry					= keystone.list( 'Inquiry' ),
	  moment					= require( 'moment' ),
	  userService				= require( '../users/user.controllers' ),
	  listService				= require( '../lists/list.controllers' ),
	  childService				= require( '../children/child.controllers' ),
	  agencyService				= require( '../agencies/agency.controllers' ),
	  staffEmailContactService	= require( '../staff email contacts/staff-email-contact.controllers' ),
	  cscRegionContactService	= require( '../csc region contacts/csc-region-contact.controllers' ),
	  inquiryEmailService		= require( './inquiry.email.controllers' ),
	  utilities					= require( '../../utils/utility.controllers' );

/* public - creates an inquiry from data submitted through the information request form on the website */
exports.createInquiry = ( { inquiry, user } ) => {
	// return a promise around creating the inquiry
	return new Promise( ( resolve, reject ) => {
		// if no inquiry object was received, abort execution and reject the promise
		if( !inquiry ) {
			// reject the promise with details of the error
			return reject( new Error( `no inquiry data received` ) );
		}

		// create variables to store the inquiry and inquirer data
		let newInquiry,
			inquiryData,
			inquirerData,
			targetRegion;

		// set default information for a staff email contact in case the real contact info can't be fetched
		let staffEmail = 'web@mareinc.org';

		// begin any asynchronous actions we can to speed up processing
		// create a variable to hold the promise for fetching the email target
		let fetchEmailTarget;
		// fetch the relevant inquirer data to populate the email
		const fetchInquirerData = extractInquirerData( user );
		// create a variable to hold the promise for creating the inquiry
		let createInquiry;

		// if we've received a child inquiry
		if( inquiry.interest === 'child info' ) {
			// attempt to create a new child inquiry
			createInquiry = saveChildInquiry( { inquiry, user } );
			// fetch the email target for child inquiries
			fetchEmailTarget = listService.getEmailTargetByName( 'child inquiry' );
		// if we've received a general inquiry
		} else if (inquiry.interest === 'general info' ) {
			// attempt to create the new general inquiry
			createInquiry = saveGeneralInquiry( { inquiry, user } );
			// fetch the email target for child inquiries
			fetchEmailTarget = listService.getEmailTargetByName( 'general inquiry' );
		// otherwise, it's an unrecognized inquiry type and
		} else {
			// reject the promise with details of the error
			return reject( new Error( `invalid interest value ${ interest }` ) );
		}

		createInquiry
			// process the result of saving the inquiry
			.then( inquiry => {
				// store the inquiry model in a variable for future processing
				newInquiry = inquiry;
				
				// store information needed for processing child inquiries if present
				if ( inquiry.children.length > 0 ) {
					// fetch the child model matching the first child in the inquiry
					// NOTE: The assumption is that all children will have the same region data, so we only need to look at the one child
					childService.getChildById( { id: inquiry.children[ 0 ] } )
						.then( child => {
							// if we have the recruitment worker region, we'll use it to find the staff region contact, otherwise, fall back to the adoption worker region
							targetRegion = child.adoptionWorkerAgencyRegion || child.recruitmentWorkerAgencyRegion;
							
							// resolve the promise with the new inquiry model
							resolve( newInquiry );
						})
						.catch( err => {
							// log the error
							console.error( `error fetching region for inquiry with id ${ inquiry.get( '_id' ) }`, err );
							// resolve the promise with the new inquiry model
							resolve( newInquiry );
						});
				} else {
					resolve( newInquiry );
				}
			})
			.catch( err => reject( new Error( `error saving inquiry` ) ) )
			// extract only the relevant fields from the inquiry, storing the results in a variable for future processing
			.then( () => extractInquiryData( newInquiry ) )
			.then( data => inquiryData = data )
			.catch( err => console.error( `error populating inquiry data for new inquiry staff email - inquiry id ${ newInquiry.get( '_id' ) }`, err ) )
			// extract only the relevant fields from the inquirer, storing the results in a variable for future processing
			.then( () => fetchInquirerData )
			.then( data => inquirerData = data )
			.catch( err => console.error( `error populating inquirer data for new inquiry staff email - inquiry id ${ newInquiry.get( '_id' ) }`, err ) )
			// fetch the staff email contact for child inquiries, overwriting the default contact details with the returned staff email
			.then( () => fetchEmailTarget )
			.then( emailTarget => staffEmailContactService.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
			.then( contact => staffEmail = contact.staffEmailContact.email )
			.catch( err => console.error( `error fetching email contact for child inquiry submission, default contact info will be used instead`, err ) )
			// fetch the staff region contact, overwriting the default contact or staff email contact details with the returned staff email
			.then( () => cscRegionContactService.getCSCRegionContactByRegion( { region: targetRegion, fieldsToPopulate: [ 'cscRegionContact' ] } ) )
			.then( contact => staffEmail = contact.cscRegionContact.email )
			.catch( err => console.error( `error fetching region contact for region with id ${ targetRegion }, default or staff email contact info will be used instead`, err ) )			
			// send a notification email to MARE staff
			.then( () => inquiryEmailService.sendNewInquiryEmailToMARE( { inquiryData, inquirerData, staffEmail } ) )
			.catch( err => console.error( `error sending new inquiry email to MARE contact about inquiry with id ${ newInquiry.get( '_id' ) }`, err ) );
	});
};

exports.getUserInquiries = ( userType, userId ) => {

    return new Promise( ( resolve, reject ) => {
        
        let inquirerRelationshipField = '';
        switch ( userType ) {
            case 'family':
                inquirerRelationshipField = 'family';
                break;
            case 'social worker':
                inquirerRelationshipField = 'socialWorker';
                break;
            case 'site visitor':
                inquirerRelationshipField = 'siteVisitor';
                break;
            default:
                console.log('no user type specified');
                return resolve([]);
        }

        Inquiry.model
            .find({ 
                [ inquirerRelationshipField ]: userId
            })
            .populate( 'inquiryMethod onBehalfOfFamily' )
            .populate({
				path: 'children',
				populate: {
					path: 'status'
				}
			})
            .sort( '-takenOn' )
            .lean()
            .exec()
            .then( inquiryDocs => resolve( inquiryDocs ) )
            .catch( error => {
                console.error( error );
                resolve( [] );
            });
    });
};

exports.extractChildrenData = inquiry => {

    const hasChildren = inquiry.children && inquiry.children.length > 0;
    const isSiblingGroup = hasChildren && inquiry.children.length > 1;
    // sort children by registration number (low -> high)
    const sortedChildren = inquiry.children.sort( ( child1, child2 ) => child1.registrationNumber - child2.registrationNumber );
    
    return { 
        hasChildren,
        areChildrenActive: hasChildren && inquiry.children[0].status.childStatus === 'active',
        isSiblingGroup,
        label: hasChildren && sortedChildren.map( child => child.displayNameAndRegistration ).join( ', ' ),
        galleryLink: hasChildren && (isSiblingGroup
            ? `/waiting-child-profiles#gallery/children/${sortedChildren.map( child => child.registrationNumber ).join( '-' )}`
            : `/waiting-child-profiles#gallery/child/${sortedChildren[0].registrationNumber}`)
    }

};

exports.saveInquiryNote = ( inquiryId, notes ) => {

    return new Promise( ( resolve, reject ) => {

        Inquiry.model
            .findById( inquiryId )
            .then( inquiryDoc => {

                // if an inquiry is found, update the note field
                if ( inquiryDoc ) {
                    inquiryDoc.notes = notes;
                    return inquiryDoc.save();
                
                // if an inquiry could not be found, throw an error
                } else {
                    throw( `Could not find Inquiry with id: ${inquiryId}.  Note could not be saved.` );
                }
            })
            .then(() => resolve())
            .catch( error => reject( error ) );
    });
};

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
			fetchInquiryMethod	= listService.getInquiryMethodByName( 'website' ),
			fetchChildren		= childService.getChildrenByRegistrationNumbersNew( targetChildren ),
			fetchMAREWebSource	= keystone.list( 'Source' ).model.findOne( { key: 'mare-web' } ).exec();
		
		Promise.all( [ fetchWebsiteBot, fetchInquiryMethod, fetchChildren, fetchMAREWebSource ] )
			.then( values => {
				// assign local variables to the values returned by the promises
				const [ websiteBot, inquiryMethod, children, mareWebSource ] = values;

				let newInquiry = new Inquiry.model({

					takenBy: websiteBot.get( '_id' ),
					takenOn: new Date(),

					inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
					inquiryType: 'child inquiry',
					inquiryMethod: inquiryMethod.get( '_id' ),

					source: mareWebSource.get( '_id' ),
					sourceDescription: inquiry.source,

					children: children.map( child => child.get( '_id' ) ),
					siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
					socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
					family: isFamily ? user.get( '_id' ) : undefined,
					onBehalfOfMAREFamily: inquiry.onBehalfOfFamily ? !!inquiry.onBehalfOfFamily.trim() : undefined,
					onBehalfOfFamilyText: inquiry.onBehalfOfFamily ? inquiry.onBehalfOfFamily.trim() : undefined,
					comments: inquiry.inquiry
				});

				newInquiry.save( ( err, model ) => {
					// if there was an issue saving the new inquiry
					if( err ) {
						// reject the promise with information about the error
						return reject( new Error( `error saving inquiry model` ) );
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
			fetchInquiryMethod	= listService.getInquiryMethodByName( 'website' ),
			fetchMAREWebSource	= keystone.list( 'Source' ).model.findOne( { key: 'mare-web' } ).exec();
		
		Promise.all( [ fetchWebsiteBot, fetchInquiryMethod, fetchMAREWebSource ] ).then( values => {

			// assign local variables to the values returned by the promises
			const [ websiteBot, inquiryMethod, mareWebSource ] = values;

			const Inquiry = keystone.list( 'Inquiry' );
			
			let newInquiry = new Inquiry.model({

				takenBy: websiteBot.get( '_id' ),
				takenOn: new Date(),

				inquirer: isSiteVisitor ? 'site visitor' : isSocialWorker ? 'social worker' : 'family',
				inquiryType: 'general inquiry',
				inquiryMethod: inquiryMethod.get( '_id' ),

				source: mareWebSource.get( '_id' ),
				sourceDescription: inquiry.source,

				siteVisitor: isSiteVisitor ? user.get( '_id' ) : undefined,
				socialWorker: isSocialWorker ? user.get( '_id' ) : undefined,
				family: isFamily ? user.get( '_id' ) : undefined,
				onBehalfOfMAREFamily: inquiry.onBehalfOfFamily ? !!inquiry.onBehalfOfFamily.trim() : undefined,
				onBehalfOfFamilyText: inquiry.onBehalfOfFamily ? inquiry.onBehalfOfFamily.trim() : undefined,
				comments: inquiry.inquiry,

				agencyReferrals: undefined, // TODO: Relationship.  Don't set, needs to be filled out by MARE staff, or we need to capture that info in the form
			});

			newInquiry.save( ( err, model ) => {
				// if there was an issue saving the new inquiry
				if( err ) {
					// reject the promise with information about the error
					return reject( new Error( `error saving inquiry model` ) );
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
			return reject( new Error( `no inquiry provided` ) );
		}
		// set the fields to populate on the inquiry model
		const fieldsToPopulate = [
			'inquiryMethod', 'source', 'children', 'childsSocialWorker',
			'family', 'onBehalfOfFamily', 'agency', 'agencyReferrals'
		];

		// populate fields on the inquiry model
		inquiry.populate( fieldsToPopulate, err => {
			// if there was an error populating the specified fields
			if ( err ) {
				// reject the promise with details about the error
				return reject( new Error( `error populating fields for inquiry with id ${ inquiry.get( '_id' ) }` ) );
			}

			// fill in all immediately available information
			const relevantData = {
				agency: inquiry.agency ? inquiry.agency.code : undefined,
				children: inquiry.children ?
						  inquiry.children.map( child => {
							  return {
								  firstName: child.name ? child.name.first : undefined,
								  registrationNumber: child.registrationNumber
							  } } ) :
						  undefined,
				childsSocialWorker: inquiry.childsSocialWorker ? inquiry.childsSocialWorker.name.full : undefined,
				comments: inquiry.comments.trim(),
				family: inquiry.family ? inquiry.family.displayNameAndRegistration : undefined,
				inquirer: inquiry.inquirer,
				inquiryMethod: inquiry.inquiryMethod ? inquiry.inquiryMethod.inquiryMethod : undfined,
				inquiryType: inquiry.inquiryType,
				isOnBehalfOfMAREFamily: inquiry.onBehalfOfMAREFamily,
				onBehalfOfMAREFamily: inquiry.onBehalfOfFamilyText,
				source: inquiry.sourceDescription.trim(),
				takenBy: 'Website Bot',
				takenOn: inquiry.takenOn ? moment( inquiry.takenOn ).utc().format( 'MM/DD/YYYY' ) : undefined
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
			return reject( new Error( `no inquirer provided` ) );
		}
		// set the fields to populate on the inquirer model
		const fieldsToPopulate = [ 'address.state', 'contact1.gender', 'contact1.race', 'contact2.gender', 'contact2.race', 'socialWorker', 'socialWorkerAgency' ];

		// populate fields on the inquirer model
		inquirer.populate( fieldsToPopulate, err => {
			// if there was an error populating the specified fields
			if ( err ) {
				// reject the promise with details about the error
				return resolve( `error populating fields for inquirer with id ${ inquirer.get( '_id' ) }` );
			}

			let relevantData = {
				name: inquirer.userType === 'family' ? inquirer.displayName : inquirer.name.full,
				email: inquirer.email,
				userType: inquirer.userType,
				dateOfBirth: inquirer.userType === 'family' && inquirer.contact1.birthDate ?
							 moment( inquirer.contact1.birthDate ).utc().format( 'MM/DD/YYYY' ) :
							 undefined,
				gender: inquirer.userType === 'family' && inquirer.contact1.gender ?
						inquirer.contact1.gender.gender :
						undefined,
				registrationNumber: inquirer.userType === 'family' && inquirer.registrationNumber ?
						inquirer.registrationNumber :
						undefined,
				ethnicity: inquirer.userType === 'family' && inquirer.contact1.race ?
						   utilities.getReadableStringFromArray( {
							   array: inquirer.contact1.race.map( race => race.race ),
							   delimiter: 'and'
						   } ) :
						   undefined,
				street1: inquirer.address ? inquirer.address.street1 : undefined,
				street2: inquirer.address ? inquirer.address.street2 : undefined,
				city: inquirer.address ? inquirer.address.displayCity : undefined,
				state: inquirer.address && inquirer.address.state ? inquirer.address.state.state : undefined,
				zipCode: inquirer.address ? inquirer.address.zipCode : undefined,
				mobilePhone: inquirer.userType === 'family' && inquirer.contact1.phone ?
							 inquirer.contact1.phone.mobile :
							 inquirer.phone.mobile,
				workPhone: inquirer.userType === 'family' && inquirer.contact1.phone ?
						   inquirer.contact1.phone.work :
						   inquirer.phone.work,
				stages: inquirer.get( 'stages' ),
				socialWorker: inquirer.userType === 'family' && inquirer.socialWorker && inquirer.socialWorker.name ?
							  inquirer.socialWorker.name.full :
							  inquirer.userType === 'family' && inquirer.socialWorkerNotListed ?
							  inquirer.socialWorkerText :
							  undefined,
				socialWorkerAgency: inquirer.userType === 'family' && inquirer.socialWorkerAgency ?
									`${ inquirer.socialWorkerAgency.name } (${ inquirer.socialWorkerAgency.code })` :
									undefined
			};
			
			// add social worker details:
			if ( inquirer.socialWorker ) {
				if ( inquirer.socialWorker.phone ) {
					relevantData[ 'socialWorkerPhoneWork' ] = inquirer.socialWorker.phone.work;
					relevantData[ 'socialWorkerPhoneMobile' ] = inquirer.socialWorker.phone.mobile;
					relevantData[ 'socialWorkerPhonePreferred' ] = inquirer.socialWorker.phone.preferred;
				}
				
				if ( inquirer.socialWorker.email ) {
					relevantData[ 'socialWorkerEmail' ] = inquirer.socialWorker.email;
				}
			}
			
			// add contact 1 and contact 2 fields:
			let isContact2Available = false;
			if ( inquirer.userType === 'family' && inquirer.contact2 ) {
				// first, check if contact 2 is not empty:
				isContact2Available = inquirer.contact2.name && inquirer.contact2.name.first && inquirer.contact2.name.first.length > 0;
				
				// add contact 1 and contact 2 fields only if contact 2 is not empty:
				if ( isContact2Available ) {
					let contacts = [ inquirer.contact1, inquirer.contact2 ];
					let index = 1;
					
					for ( let contact of contacts ) {
						if ( contact.name ) {
							relevantData[ 'contact' + index + 'FullName' ] = contact.name.full;
						}
						if ( contact.phone ) {
							relevantData[ 'contact' + index + 'PhoneMobile' ] = contact.phone.mobile;
							relevantData[ 'contact' + index + 'PhoneWork' ] = contact.phone.work;
						}
						relevantData[ 'contact' + index + 'Email' ] = contact.email;
						
						relevantData[ 'contact' + index + 'PreferredCommunicationMethod' ] = contact.preferredCommunicationMethod;
						relevantData[ 'contact' + index + 'Gender' ] = contact.gender ? contact.gender.gender : undefined;
						relevantData[ 'contact' + index + 'Race' ] = contact.race ?
							   utilities.getReadableStringFromArray( {
								   array: contact.race.map( race => race.race ),
								   delimiter: 'and'
							   } ) :
							   undefined;
						relevantData[ 'contact' + index + 'Occupation' ] = contact.occupation;
						relevantData[ 'contact' + index + 'BirthDate' ] = contact.birthDate ? moment( contact.birthDate ).utc().format( 'MM/DD/YYYY' ) : undefined;
						
						index++;
					}
				}
			}
			relevantData[ 'contact2Available' ] = isContact2Available;

			if( relevantData.stages ) {
				let stagesToSort = [];

				// format the gathering information date if one exists
				if( relevantData.stages.gatheringInformation && relevantData.stages.gatheringInformation.date instanceof Date ) {
					relevantData.stages.gatheringInformation.date = moment( relevantData.stages.gatheringInformation.date ).utc().format( 'MM/DD/YYYY' );
					
					stagesToSort.push({
						sortKey: parseInt( moment( relevantData.stages.gatheringInformation.date ).utc().format( 'YYYY-MM-DD' ).replace(/\-/g, '') + '1' ),
						dataKey: 'gatheringInformation'
					});
				}
				// format the looking for agency date if one exists
				if( relevantData.stages.lookingForAgency && relevantData.stages.lookingForAgency.date instanceof Date ) {
					relevantData.stages.lookingForAgency.date = moment( relevantData.stages.lookingForAgency.date ).utc().format( 'MM/DD/YYYY' );
					
					stagesToSort.push({
						sortKey: parseInt( moment( relevantData.stages.lookingForAgency.date ).utc().format( 'YYYY-MM-DD' ).replace(/\-/g, '') + '2' ),
						dataKey: 'lookingForAgency'
					});
				}
				// format the working with agency date if one exists
				if( relevantData.stages.workingWithAgency && relevantData.stages.workingWithAgency.date instanceof Date ) {
					relevantData.stages.workingWithAgency.date = moment( relevantData.stages.workingWithAgency.date ).utc().format( 'MM/DD/YYYY' );
					
					stagesToSort.push({
						sortKey: parseInt( moment( relevantData.stages.workingWithAgency.date ).utc().format( 'YYYY-MM-DD' ).replace(/\-/g, '') + '3' ),
						dataKey: 'workingWithAgency'
					});
				}
				// format the MAPP training completed date if one exists
				if( relevantData.stages.MAPPTrainingCompleted && relevantData.stages.MAPPTrainingCompleted.date instanceof Date ) {
					relevantData.stages.MAPPTrainingCompleted.date = moment( relevantData.stages.MAPPTrainingCompleted.date ).utc().format( 'MM/DD/YYYY' );
					
					stagesToSort.push({
						sortKey: parseInt( moment( relevantData.stages.MAPPTrainingCompleted.date ).utc().format( 'YYYY-MM-DD' ).replace(/\-/g, '') + '4' ),
						dataKey: 'MAPPTrainingCompleted'
					});
				}
				
				// sort desc to get the most recent:
				stagesToSort.sort( function( a, b ) { return ( a.sortKey > b.sortKey ) ? -1 : ( ( b.sortKey > a.sortKey ) ? 1 : 0 ); } );
				if ( stagesToSort.length > 0 ) {
					let onlyRecentStage = relevantData.stages[ stagesToSort[ 0 ].dataKey ];
					relevantData.stages = {};
					relevantData.stages[ stagesToSort[ 0 ].dataKey ] = onlyRecentStage;
				}
			}
			
			// add homestudy:
			if ( inquirer.userType === 'family' && inquirer.homestudy && inquirer.homestudy.completed ) {
				relevantData[ 'homestudy' ] = {
					started: inquirer.homestudy.initialDate instanceof Date ? moment( inquirer.homestudy.initialDate ).utc().format( 'MM/DD/YYYY' ) : undefined
				}
			}

			resolve( relevantData );
		});
	});
}
