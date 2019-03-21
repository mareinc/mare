const listService = require( './service_lists' ),
	  socialWorkerService = require( './service_social-worker' ),
	  excel = require( 'excel4node' ),
	  moment = require( 'moment' );

exports.createWorkbook = () => {
  // create and return a new excel workbook
  return new excel.Workbook();
};

exports.createChildrenWorksheet = ({ event, workbook, attendees = [], unregisteredAttendees = [] }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Children', exports.getSheetOptions({
			cellWidth: 'small'
		}));

		// get the styles to apply to the content cells and create a reusable style
		const headerCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true,
				wrapText: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true,
				wrapText: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Children',
			attendeeCount: attendees.length + unregisteredAttendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( headerCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( headerCellStyle );
		worksheet.cell( 7, 4 ).string( 'legal status' ).style( headerCellStyle );
		worksheet.cell( 7, 5 ).string( 'age' ).style( headerCellStyle );
		worksheet.cell( 7, 6 ).string( 'sibling(s)' ).style( headerCellStyle );
		worksheet.cell( 7, 7 ).string( 'record number' ).style( headerCellStyle );
		worksheet.cell( 7, 8 ).string( 'status' ).style( headerCellStyle );
		worksheet.cell( 7, 9 ).string( 'social worker name' ).style( headerCellStyle );
		worksheet.cell( 7, 10 ).string( 'social worker agency' ).style( headerCellStyle );
		worksheet.cell( 7, 11 ).string( 'social worker region' ).style( headerCellStyle );
		worksheet.cell( 7, 12 ).string( 'notes' ).style( headerCellStyle );

		// set the row to 1 to begin entering attendee information
		let row = 8;

		// loop through each unregistered child attending the event
		for( let child of unregisteredAttendees ) {
			// set default values for the social worker's name, agency, and region
			let socialWorkerName = '',
				socialWorkerAgency = '',
				socialWorkerRegion = '';

			try {
				// fetch the social worker who registered the child
				// NOTE: if no social worker can be found, it will skip setting all values below as the promise will reject
				const socialWorker = await socialWorkerService.getSocialWorkerById( child.registrantID );
				// extract the full name of the social worker
				socialWorkerName = socialWorker.get( 'name.full' );
				// if the social worker has an agency selected
				if( socialWorker.get( 'agency' ) ) {
					// attempt to populate the agency field to allow us to extract the agency code and region
					await new Promise( ( resolve, reject ) => {

						socialWorker.populate( 'agency', err => {

							if( err ) {
								// log the error for debugging purposes
								console.error( `error populating agency field on social worker ${ socialWorker.get( 'name.full' ) } - ${ err }`);
							}

							resolve();
						});
					});
					// extract the agency code from the social worker's agency
					socialWorkerAgency = socialWorker.agency.get( 'code' );
					// attempt to populate the region field for the social worker's agency
					await new Promise( ( resolve, reject ) => {
						// populate fields on the child model
						socialWorker.get( 'agency' ).populate( 'address.region', err => {
	
							if( err ) {
								// log the error for debugging purposes
								console.error( `error populating region on social worker ${ socialWorker.get( 'name.full' ) } - ${ err }`);
							}
	
							resolve();
						});
					});
					// extract the region name from the social worker's agency
					socialWorkerRegion = socialWorker.get( 'agency.address.region.region' );
				}
			}
			catch( error ) {
				console.error( `error fetching social worker information for child ${ child.get( 'name.full' )} - ${ error }` );
			}

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( child.get( 'name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( child.get( 'name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).style( cellStyle );
			worksheet.cell( row, 5 ).string( child.get( 'age' ) ? child.get( 'age' ).toString() : '' ).style( cellStyle );
			worksheet.cell( row, 6 ).style( cellStyle );
			worksheet.cell( row, 7 ).string( 'not reg.' ).style( cellStyle );
			worksheet.cell( row, 8 ).string( 'not reg.' ).style( cellStyle );
			worksheet.cell( row, 9 ).string( socialWorkerName ).style( cellStyle );
			worksheet.cell( row, 10 ).string( socialWorkerAgency ).style( cellStyle );
			worksheet.cell( row, 11 ).string( socialWorkerRegion ).style( cellStyle );
			worksheet.cell( row, 12 ).style( cellStyle );
			
			// increment the row data will be written to
			row++;
		}

		if( attendees.length > 0 ) {
			// set the fields to populate on the child model
			const fieldsToPopulate = [ 'siblingsToBePlacedWith', 'status', 'legalStatus', 'adoptionWorker' ];

			// loop through each registered child attending the event
			for( const child of attendees ) {

				await new Promise( ( resolve, reject ) => {
					// populate fields on the child model
					child.populate( fieldsToPopulate, err => {

						if( err ) {
							// log the error for debugging purposes
							console.error( `error populating fields on child ${ child.get( 'displayNameAndRegistration' ) } - ${ err }`);
						}

						resolve();
					});
				});

				let adoptionWorkerName = '',
					adoptionWorkerAgency = '',
					adoptionWorkerRegion = '';

				const adoptionWorkerFieldsToPopulate = [ 'agency' ];

				if( child.get( 'adoptionWorker' ) ) {

					await new Promise( ( resolve, reject ) => {
						// populate adoption worker fields on the child model
						child.get( 'adoptionWorker' ).populate( adoptionWorkerFieldsToPopulate, err => {

							if( err ) {
								// log the error for debugging purposes
								console.error( `error populating adoption worker fields on child ${ child.get( 'displayNameAndRegistration' ) } -${ err }` );
							}

							resolve();
						});
					});

					const adoptionWorkerCityId = child.get( 'adoptionWorker.address.city' )
						? child.get( 'adoptionWorker.address.city' ).toString()
						: null;

					try {
						const cityModel = await listService.getCityOrTownById( adoptionWorkerCityId );

						if( cityModel ) {

							await new Promise( ( resolve, reject ) => {

								cityModel.populate( 'region', err => {

									if( err ) {
										console.error( `error populating adoption worker region field on child ${ child.get( 'displayNameAndRegistration' ) } -${ err }` );
									}

									resolve();
								});
							});

							adoptionWorkerRegion = cityModel.get( 'region.region' );
						}
					}
					catch( error ) {
						console.error( `error fetching adoption worker region - ${ error }` );
					}

					// set the adoption worker fields
					adoptionWorkerName = child.get( 'adoptionWorker.name.full' );
					adoptionWorkerAgency = child.get( 'adoptionWorker.agency.name' );
				}

				// convert the siblings array into a comma separated string
				const siblingsToBePlacedWith = child.get( 'siblingsToBePlacedWith' ).map( child => `${ child.get( 'name.first' ) }` );

				// calculate the child's age based on their birthday
				const age = child.get( 'birthDate' )
					? moment().diff( child.get( 'birthDate' ), 'years' ).toString()
					: '';
				
				// fill attendee data in the appropriate cells
				worksheet.cell( row, 1 ).style( cellStyle );
				worksheet.cell( row, 2 ).string( child.get( 'name.first' ) || '' ).style( cellStyle );
				worksheet.cell( row, 3 ).string( child.get( 'name.last' ) || '' ).style( cellStyle );
				worksheet.cell( row, 4 ).string( child.get( 'legalStatus' ).legalStatus ).style( cellStyle );
				worksheet.cell( row, 5 ).string( age ).style( cellStyle );
				worksheet.cell( row, 6 ).string( siblingsToBePlacedWith.join( ', ' ) ).style( cellStyle );
				worksheet.cell( row, 7 ).number( child.get( 'registrationNumber' ) ).style( cellStyle );
				worksheet.cell( row, 8 ).string( child.get( 'status' ).childStatus ).style( cellStyle );
				worksheet.cell( row, 9 ).string( adoptionWorkerName ).style( cellStyle );
				worksheet.cell( row, 10 ).string( adoptionWorkerAgency ).style( cellStyle );
				worksheet.cell( row, 11 ).string( adoptionWorkerRegion || '' ).style( cellStyle );
				worksheet.cell( row, 12 ).style( cellStyle );
				
				// increment the row data will be written to
				row++;
			}

			resolve();

		} else {

			resolve();
		}
	});
};

exports.createFamiliesWorksheet = ({ event, workbook, attendees, unregisteredChildAttendees, unregisteredAdultAttendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Families', exports.getSheetOptions({
			cellWidth: 'small'
		}));

		// get the styles to apply to the content cells and create a reusable style
		const headerCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true,
				wrapText: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true,
				wrapText: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Families',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( headerCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( headerCellStyle );
		worksheet.cell( 7, 4 ).string( 'first name' ).style( headerCellStyle );
		worksheet.cell( 7, 5 ).string( 'last name' ).style( headerCellStyle );
		worksheet.cell( 7, 6 ).string( 'city' ).style( headerCellStyle );
		worksheet.cell( 7, 7 ).string( 'state' ).style( headerCellStyle );
		worksheet.cell( 7, 8 ).string( 'contact 1 email' ).style( headerCellStyle );
		worksheet.cell( 7, 9 ).string( 'contact 2 email' ).style( headerCellStyle );
		worksheet.cell( 7, 10 ).string( 'most recent state' ).style( headerCellStyle );
		worksheet.cell( 7, 11 ).string( 'other adults' ).style( headerCellStyle );
		worksheet.cell( 7, 12 ).string( 'other children' ).style( headerCellStyle );
		worksheet.cell( 7, 13 ).string( 'notes' ).style( headerCellStyle );

		// set the row to 1 to begin entering attendee information
		let row = 8;

		// set the fields to populate on the family model
		const fieldsToPopulate = [ 'address.state' ];

		// loop through each family attending the event
		for( let attendee of attendees ) {

			await new Promise( ( resolve, reject ) => {
				// populate fields on the family model
				attendee.populate( fieldsToPopulate, err => {

					if( err ) {
						// log the error for debugging purposes
						console.error( `error populating fields on family ${ attendee.get( 'displayName' ) } - ${ err }`);
					}

					resolve();
				});
			});

			// determine the users farthest completed stage
			let stage = '';

			if( attendee.get( 'homestudy.completed' ) ) {
				stage = 'homestudy completed';
			} else if( attendee.get( 'stages.MAPPTrainingCompleted.completed' ) ) {
				stage = 'MAPP training completed';
			} else if( attendee.get( 'stages.workingWithAgency.started' ) ) {
				stage = 'working with agency';
			} else if( attendee.get( 'stages.lookingForAgency.started' ) ) {
				stage = 'looking for agency';
			} else if( attendee.get( 'stages.gatheringInformation.started' ) ) {
				stage = 'gathering information';
			}

			// get just the unregistered children and adults being brought by the current family
			const unregisteredChildren = unregisteredChildAttendees.filter( child => child.registrantID === attendee.get( '_id' ).toString() );
			const unregisteredAdults = unregisteredAdultAttendees.filter( adult => adult.registrantID === attendee.get( '_id' ).toString() );
			// extract the names of all unregistered children and adults into arrays
			const unregisteredChildNames = unregisteredChildren.map( child => `${ child.name.first } ${ child.name.last }` );
			const unregisteredAdultNames = unregisteredAdults.map( adult => `${ adult.name.first } ${ adult.name.last }` );

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( attendee.get( 'contact1.name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'contact1.name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( attendee.get( 'contact2.name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( attendee.get( 'contact2.name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 6 ).string( attendee.get( 'address.displayCity' ) || '' ).style( cellStyle );
			worksheet.cell( row, 7 ).string( attendee.get( 'address.state' ) ? attendee.get( 'address.state' ).state : '' ).style( cellStyle );
			worksheet.cell( row, 8 ).string( attendee.get( 'contact1.email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 9 ).string( attendee.get( 'contact2.email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 10 ).string( stage ).style( cellStyle );
			worksheet.cell( row, 11 ).string( unregisteredAdultNames.join( ', ' ) ).style( cellStyle );
			worksheet.cell( row, 12 ).string( unregisteredChildNames.join( ', ' ) ).style( cellStyle );
			worksheet.cell( row, 13 ).style( cellStyle );

			// increment the row data will be written to
			row++;
		}

		resolve();
	});
};

exports.createSocialWorkersWorksheet = ({ event, workbook, attendees, childAttendees, unregisteredChildAttendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Social Workers', exports.getSheetOptions() );

		// get the styles to apply to the content cells and create a reusable style
		const headerCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true,
				wrapText: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true,
				wrapText: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Social Workers',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( headerCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( headerCellStyle );
		worksheet.cell( 7, 4 ).string( 'agency' ).style( headerCellStyle );
		worksheet.cell( 7, 5 ).string( 'email' ).style( headerCellStyle );
		worksheet.cell( 7, 6 ).string( 'bringing' ).style( headerCellStyle );
		worksheet.cell( 7, 7 ).string( 'region' ).style( headerCellStyle );
		worksheet.cell( 7, 8 ).string( 'notes' ).style( headerCellStyle );

		// set the row to 1 to begin entering attendee information
		let row = 8;

		// set the fields to populate on the social worker model
		const fieldsToPopulate = [ 'agency', 'city' ];

		// loop through each social worker attending the event
		for( let attendee of attendees ) {

			await new Promise( ( resolve, reject ) => {
				// populate fields on the social worker model
				attendee.populate( fieldsToPopulate, err => {

					if( err ) {
						// log the error for debugging purposes
						console.error( `error populating fields on social worker ${ attendee.get( 'displayName' ) } - ${ err }`);
					}

					resolve();
				});
			});

			const cityId = attendee.get( 'address.city' )
					? attendee.get( 'address.city' ).toString()
					: null;

			let region = '';

			try {
				const cityModel = await listService.getCityOrTownById( cityId );

				await new Promise( ( resolve, reject ) => {
					if( cityModel ) {
						cityModel.populate( 'region', err => {

							if( err ) {
								console.error( `error populating adoption worker region field on child ${ child.get( 'displayNameAndRegistration' ) } -${ err }` );
							}

							resolve();
						});
					} else {
						resolve();
					}
				});

				region = cityModel
					? cityModel.get( 'region.region' )
					: '';
			}
			catch( error ) {
				console.error( `error fetching adoption worker region - ${ error }` );
			}

			// TODO: this is sloppy as the adoption and recruitment workers were populated in a prior step.  Consider copying the object before populating at each step
			const registeredChildren = childAttendees.filter( child => {
				return ( child.get( 'adoptionWorker._id' ) && child.get( 'adoptionWorker._id' ).toString() === attendee.get( '_id' ).toString() )
					|| ( child.get( 'recruitmentWorker' ) && child.get( 'recruitmentWorker' ).toString() === attendee.get( '_id' ).toString() );
			});
			// get just the unregistered children being brought by the current social worker
			const unregisteredChildren = unregisteredChildAttendees.filter( child => child.registrantID === attendee.get( '_id' ).toString() );
			// extract the names of all registered and unregistered children into arrays
			const registeredChildNames = registeredChildren.map( child => `${ child.name.first } ${ child.name.last }` );
			const unregisteredChildNames = unregisteredChildren.map( child => `${ child.name.first } ${ child.name.last }` );
			// combine the arrays of registered and unregistered children
			const allChildNames = [ ...registeredChildNames, ...unregisteredChildNames ];

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( attendee.get( 'name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( attendee.get( 'agency' ) ? attendee.get( 'agency' ).name : '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 6 ).string( allChildNames.join( ', ' ) ).style( cellStyle );
			worksheet.cell( row, 7 ).string( region || '' ).style( cellStyle );
			worksheet.cell( row, 8 ).style( cellStyle );
			// increment the row data will be written to
			row++;
		}

		resolve();
	});
};

exports.createStaffWorksheet = ({ event, workbook, attendees }) => {
	// create a worksheet and label it
	const worksheet = workbook.addWorksheet( 'Staff', exports.getSheetOptions() );

	// get the styles to apply to the content cells and create a reusable style
	const headerCellStyleOptions = exports.getCellStyle({
		options: {
			border: true,
			centered: true,
			wrapText: true
		}
	});

	const cellStyleOptions = exports.getCellStyle({
		options: {
			border: true,
			leftAligned: true,
			wrapText: true
		}
	});

	const cellStyle = workbook.createStyle( cellStyleOptions );
	const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

	// add the event header information to the worksheet
	exports.appendEventHeader({
		event,
		workbook,
		worksheet,
		label: 'Staff',
		attendeeCount: attendees.length
	});

	// create the column headers
	worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
	worksheet.cell( 7, 2 ).string( 'first name' ).style( headerCellStyle );
	worksheet.cell( 7, 3 ).string( 'last name' ).style( headerCellStyle );
	worksheet.cell( 7, 4 ).string( 'email' ).style( headerCellStyle );
	worksheet.cell( 7, 5 ).string( 'phone' ).style( headerCellStyle );
	worksheet.cell( 7, 6 ).string( 'notes' ).style( headerCellStyle );
	// set the row to 1 to begin entering attendee information
	let row = 8;
	// loop through each staff member attending the event
	for( const attendee of attendees ) {
		// pull the preferred phone number listed for the admin
		const preferredPhone = attendee.get( 'phone.preferred' );
		// create a variable to store the best phone number to reach the user at based on their preferences
		let phone;
		// if the user specified their work phone as the preferred number
		if( preferredPhone === 'work' ) {
			// pull the first available phone number, prioritizing work, then mobile, then home phone
			phone = attendee.get( 'phone.work' )
				|| attendee.get( 'phone.mobile' )
				|| attendee.get( 'phone.home' );
		// if the user specified their mobile phone as the preferred number
		} else if( preferredPhone === 'mobile' ) {
			// pull the first available phone number, prioritizing mobile, then work, then home phone
			phone = attendee.get( 'phone.mobile' )
				|| attendee.get( 'phone.work' )
				|| attendee.get( 'phone.home' );
		// if the user specified their home phone as the preferred number
		} else if( preferredPhone === 'home' ) {
			// pull the first available phone number, prioritizing home, then work, then home mobile
			phone = attendee.get( 'phone.home' )
				|| attendee.get( 'phone.work' )
				|| attendee.get( 'phone.mobile' );
		}

		// fill attendee data in the appropriate cells
		worksheet.cell( row, 1 ).style( cellStyle );
		worksheet.cell( row, 2 ).string( attendee.get( 'name.first' ) || '' ).style( cellStyle );
		worksheet.cell( row, 3 ).string( attendee.get( 'name.last' ) || '' ).style( cellStyle );
		worksheet.cell( row, 4 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
		worksheet.cell( row, 5 ).string( phone || '' ).style( cellStyle );
		worksheet.cell( row, 6 ).style( cellStyle );
		// increment the row data will be written to
		row++;
	}
}

exports.createSiteVisitorsWorksheet = ({ event, workbook, attendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Site Visitors', exports.getSheetOptions() );

		// get the styles to apply to the content cells and create a reusable style
		const headerCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true,
				wrapText: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true,
				wrapText: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Site Visitors',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( headerCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( headerCellStyle );
		worksheet.cell( 7, 4 ).string( 'email' ).style( headerCellStyle );
		worksheet.cell( 7, 5 ).string( 'phone' ).style( headerCellStyle );
		worksheet.cell( 7, 6 ).string( 'city' ).style( headerCellStyle );
		worksheet.cell( 7, 7 ).string( 'state' ).style( headerCellStyle );
		worksheet.cell( 7, 8 ).string( 'notes' ).style( headerCellStyle );
		
		// set the row to 1 to begin entering attendee information
		let row = 8;
		// loop through each staff member attending the event
		for( const attendee of attendees ) {
			// pull the preferred phone number listed for the admin
			const preferredPhone = attendee.get( 'phone.preferred' );
			// create a variable to store the best phone number to reach the user at based on their preferences
			let phone = '';
			// if the user specified their work phone as the preferred number
			if( preferredPhone === 'work' ) {
				// pull the first available phone number, prioritizing work, then mobile, then home phone
				phone = attendee.get( 'phone.work' )
					|| attendee.get( 'phone.mobile' )
					|| attendee.get( 'phone.home' );
			// if the user specified their mobile phone as the preferred number
			} else if( preferredPhone === 'mobile' ) {
				// pull the first available phone number, prioritizing mobile, then work, then home phone
				phone = attendee.get( 'phone.mobile' )
					|| attendee.get( 'phone.work' )
					|| attendee.get( 'phone.home' );
			// if the user specified their home phone as the preferred number
			} else if( preferredPhone === 'home' ) {
				// pull the first available phone number, prioritizing home, then work, then home mobile
				phone = attendee.get( 'phone.home' )
					|| attendee.get( 'phone.work' )
					|| attendee.get( 'phone.mobile' );
			}
			// create a variable to store the site visitor's city
			let city = '';

			// if the attendee is outside Massachusetts, the city will be entered in the free text field
			if( attendee.get( 'address.isOutsideMassachusetts' ) ) {    
				city = attendee.get( 'address.cityText' );
			// if the attendee is in Massachusetts, the city will be a relationship field that we need to fetch
			} else {
				// get the family's city
				const familyCity = attendee.get( 'address.city' )
					? attendee.get( 'address.city' ).toString()
					: null;
				// fetch the city model and extract the name of the city or town
				try {
					const cityModel = await listService.getCityOrTownById( familyCity );
					city = cityModel.get( 'cityOrTown' );
				}
				catch( error ) {
					console.error( `error fetching city for site visitor ${ attendee.get( 'name.full' ) } - ${ error }` );
				}
			}

			// create a variable to store the site visitor's city
			let state = '';

			// get the family's state
			const familyState = attendee.get( 'address.state' )
				? attendee.get( 'address.state' ).toString()
				: null;

			// fetch the state model and extract the name of the state
			try {
				const stateModel = await listService.getStateById( familyState );
				state = stateModel.get( 'state' );
			}
			catch( error ) {
				console.error( `error fetching state for site visitor ${ attendee.get( 'name.full' ) } - ${ error }` );
			}

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( attendee.get( 'name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( phone ).style( cellStyle );
			worksheet.cell( row, 6 ).string( city ).style( cellStyle );
			worksheet.cell( row, 7 ).string( state ).style( cellStyle );
			worksheet.cell( row, 8 ).style( cellStyle );
			// increment the row data will be written to
			row++;
		}
		// resolve the promise to allow the calling function to process the results
		resolve();
	});
}

exports.createOutsideContactsWorksheet = ({ event, workbook, attendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Outside Contacts', exports.getSheetOptions() );

		// get the styles to apply to the content cells and create a reusable style
		const headerCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true,
				wrapText: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true,
				wrapText: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const headerCellStyle = workbook.createStyle( headerCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({ event,
			workbook,
			worksheet,
			label: 'Outside Contacts',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( headerCellStyle );
		worksheet.cell( 7, 2 ).string( 'name' ).style( headerCellStyle );
		worksheet.cell( 7, 3 ).string( 'email' ).style( headerCellStyle );
		worksheet.cell( 7, 4 ).string( 'phone' ).style( headerCellStyle );
		worksheet.cell( 7, 5 ).string( 'city' ).style( headerCellStyle );
		worksheet.cell( 7, 6 ).string( 'state' ).style( headerCellStyle );
		worksheet.cell( 7, 7 ).string( 'notes' ).style( headerCellStyle );
		
		// set the row to 1 to begin entering attendee information
		let row = 8;
		// loop through each staff member attending the event
		for( const attendee of attendees ) {
			// pull the preferred phone number listed for the admin
			const preferredPhone = attendee.get( 'phone.preferred' );
			// create a variable to store the best phone number to reach the user at based on their preferences
			let phone;
			// if the user specified their work phone as the preferred number
			if( preferredPhone === 'work' ) {
				// pull the first available phone number, prioritizing work, then mobile, then home phone
				phone = attendee.get( 'phone.work' )
					|| attendee.get( 'phone.mobile' );
			// if the user specified their mobile phone as the preferred number
			} else if( preferredPhone === 'mobile' ) {
				// pull the first available phone number, prioritizing mobile, then work, then home phone
				phone = attendee.get( 'phone.mobile' )
					|| attendee.get( 'phone.work' );
			}

			// create a variable to store the site visitor's city
			let state;
			// fetch the state model and extract the name of the state
			try {
				const stateModel = await listService.getStateById( attendee.get( 'address.state' ).toString() );
				state = stateModel.get( 'state' );
			}
			catch( error ) {
				console.error( `error fetching state for site visitor ${ attendee.get( 'name.full' ) } - ${ error }` );
			}

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( attendee.get( 'name' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( phone || '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( attendee.get( 'address.city' ) || '' ).style( cellStyle );
			worksheet.cell( row, 6 ).string( state || '' ).style( cellStyle );
			worksheet.cell( row, 7 ).style( cellStyle );
			// increment the row data will be written to
			row++;
		}
		// resolve the promise to allow the calling function to process the results
		resolve();
	});
};

exports.appendEventHeader = ( { event, workbook, worksheet, label, attendeeCount } ) => {
	// build the address string for the event
	const address = `${ event.get( 'address.street1' ) } ${ event.get( 'address.street2' ) }, ${ event.get( 'address.city' ) }`;
		
	// use moment to generate formatted dates
	const startDate	= event.get( 'startDate' )
		? moment( event.startDate ).utc().format( 'dddd MMMM Do, YYYY' )
		: null;

	const endDate	= event.get( 'endDate' )
		? moment( event.endDate ).utc().format( 'dddd MMMM Do, YYYY' )
		: null;

	// create a string to display the date and initialize it with the start date, which should always exist
	let dateString = startDate;
	
	if( endDate && startDate !== endDate ) {
		dateString += ` to ${ endDate }`;
	}

	// get the styles to apply to the content cells and create a reusable style
	const cellStyleOptions = exports.getCellStyle({
		options: {
			bold: true
		}
	});

	const cellStyle = workbook.createStyle( cellStyleOptions );

	// create sheet description cells
	worksheet.cell( 2, 1 ).string( event.get( 'name' ) ).style( cellStyle );
	worksheet.cell( 3, 1 ).string( address ).style( cellStyle );
	worksheet.cell( 4, 1 ).string( `${ label } (${ attendeeCount } attending)` ).style( cellStyle );
	worksheet.cell( 5, 1 ).string( dateString ).style( cellStyle );
};

exports.getCellStyle = ( { options = {} } ) => {

	let styles = {
		alignment: {},
		font: {},
		border: {}
	};

	if( options.centered ) {
		styles.alignment = Object.assign( styles.alignment, {
			horizontal: 'center',
			vertical: 'center'
		});
	}

	if( options.leftAligned ) {
		styles.alignment = Object.assign( styles.alignment, { horizontal: 'left' } );
	}

	if( options.wrapText ) {
		styles.alignment = Object.assign( styles.alignment, { wrapText: true } );
	}

	if( options.bold ) {
		styles.font = Object.assign( styles.font, { bold: true } );
	}

	if( options.border ) {
		styles.border = Object.assign( styles.border, {
			left: { style: 'thin' },
			right: { style: 'thin' },
			top: { style: 'thin' },
			bottom: { style: 'thin' }
		} );
	}

	return styles;
};

exports.getSheetOptions = ( options = {} ) => {
	return {
		'sheetFormat': {
			'defaultColWidth': options.cellWidth === 'small' ? 20 : 28,
			'defaultRowHeight': 32
		},
		'printOptions': {
			'centerHorizontal': true,
			'centerVertical': true,
			// 'printGridLines': true,
			'printHeadings': true
	
		}
	};
};