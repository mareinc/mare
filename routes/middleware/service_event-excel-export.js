const listService = require( './service_lists' ),
	  excel = require( 'excel4node' ),
	  moment = require( 'moment' );

exports.createWorkbook = () => {
  // create and return a new excel workbook
  return new excel.Workbook();
};

exports.createChildrenWorksheet = ({ event, workbook, attendees = [], unregisteredAttendees = [], socialWorkers = [], families = [] }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Children', exports.getSheetOptions({
			cellWidth: 'small'
		}));

		// get the styles to apply to the content cells and create a reusable style
		const centeredCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Children',
			attendeeCount: attendees.length + unregisteredAttendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( centeredCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( centeredCellStyle );
		worksheet.cell( 7, 4 ).string( 'sibling(s)' ).style( centeredCellStyle );
		worksheet.cell( 7, 5 ).string( 'race' ).style( centeredCellStyle );
		worksheet.cell( 7, 6 ).string( 'age' ).style( centeredCellStyle );
		worksheet.cell( 7, 7 ).string( 'reg. #' ).style( centeredCellStyle );
		worksheet.cell( 7, 8 ).string( 'page' ).style( centeredCellStyle );
		worksheet.cell( 7, 9 ).string( 'status' ).style( centeredCellStyle );
		worksheet.cell( 7, 10 ).string( 'legal status' ).style( centeredCellStyle );
		worksheet.cell( 7, 11 ).string( 'coming with' ).style( centeredCellStyle );
		worksheet.cell( 7, 12 ).string( 'notes' ).style( centeredCellStyle );

		// set the row to 1 to begin entering attendee information
		let row = 8;

		// loop through each unregistered child attending the event
		for( let child of unregisteredAttendees ) {
			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( child.get( 'name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( child.get( 'name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).style( cellStyle );
			worksheet.cell( row, 5 ).style( cellStyle );
			worksheet.cell( row, 6 ).string( child.get( 'age' ) ? child.get( 'age' ).toString() : '' ).style( cellStyle );
			worksheet.cell( row, 7 ).string( 'not reg.' ).style( cellStyle );
			worksheet.cell( row, 8 ).style( cellStyle );
			worksheet.cell( row, 9 ).string( 'not reg.' ).style( cellStyle );
			worksheet.cell( row, 10 ).style( cellStyle );
			worksheet.cell( row, 11 ).style( cellStyle );
			worksheet.cell( row, 12 ).style( cellStyle );
			
			// increment the row data will be written to
			row++;
		}

		if( attendees.length > 0 ) {
			// set the fields to populate on the child model
			const fieldsToPopulate = [ 'siblings', 'race', 'status', 'legalStatus', 'adoptionWorker', 'recruitmentWorker' ];

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

				// convert the siblings array into a comma separated string
				const siblings = child.get( 'siblings' ).map( child => `${ child.get( 'name.first' ) } ${ child.get( 'name.last' ) }` ).join( ', ' )

				// convert the races array into a comma separated string
				const race = child.get( 'race' ).map( race => race.race ).join( ', ' );

				// calculate the child's age based on their birthday
				const age = child.get( 'birthDate' )
					? moment().diff( child.get( 'birthDate' ), 'years' ).toString()
					: '';

				// // use the social worker attendees to figure out who is bringing the child
				// const recruitmentWorkerId = child.get( 'recruitmentWorker' )
				// 	? child.get( 'recruitmentWorker._id' ).toString()
				// 	: null;

				// const adoptionWorkerId = child.get( 'adoptionWorker' )
				// 	? child.get( 'adoptionWorker._id' ).toString()
				// 	: null;

				// let comingWithSocialWorker;
				
				// if( recruitmentWorkerId ) {
				// 	comingWithSocialWorker = socialWorkers.find( socialWorker => socialWorker.get( '_id' ).toString() === recruitmentWorkerId );
				// }
				
				// if( adoptionWorkerId && !comingWithSocialWorker ) {
				// 	comingWithSocialWorker = socialWorkers.find( socialWorker => socialWorker.get( '_id' ).toString() === adoptionWorkerId );
				// }

				// if( comingWithSocialWorker ) {
				// 	// TODO: finish fetching agency and social worker name
				// }
				

				// fill attendee data in the appropriate cells
				worksheet.cell( row, 1 ).style( cellStyle );
				worksheet.cell( row, 2 ).string( child.get( 'name.first' ) || '' ).style( cellStyle );
				worksheet.cell( row, 3 ).string( child.get( 'name.last' ) || '' ).style( cellStyle );
				worksheet.cell( row, 4 ).string( siblings ).style( cellStyle );
				worksheet.cell( row, 5 ).string( race ).style( cellStyle );
				worksheet.cell( row, 6 ).string( age ).style( cellStyle );
				worksheet.cell( row, 7 ).number( child.get( 'registrationNumber' ) ).style( cellStyle );
				worksheet.cell( row, 8 ).string( child.get( 'photolistingPageNumber' ) || '' ).style( cellStyle );
				worksheet.cell( row, 9 ).string( child.get( 'status' ).childStatus ).style( cellStyle );
				worksheet.cell( row, 10 ).string( child.get( 'legalStatus' ).legalStatus ).style( cellStyle );
				worksheet.cell( row, 11 ).string( '' ).style( cellStyle );
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
		const centeredCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Families',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( centeredCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( centeredCellStyle );
		worksheet.cell( 7, 4 ).string( 'first name' ).style( centeredCellStyle );
		worksheet.cell( 7, 5 ).string( 'last name' ).style( centeredCellStyle );
		worksheet.cell( 7, 6 ).string( 'other(s)' ).style( centeredCellStyle );
		worksheet.cell( 7, 7 ).string( 'street' ).style( centeredCellStyle );
		worksheet.cell( 7, 8 ).string( 'city' ).style( centeredCellStyle );
		worksheet.cell( 7, 9 ).string( 'state' ).style( centeredCellStyle );
		worksheet.cell( 7, 10 ).string( 'zip' ).style( centeredCellStyle );
		worksheet.cell( 7, 11 ).string( 'telephone' ).style( centeredCellStyle );
		worksheet.cell( 7, 12 ).string( 'email' ).style( centeredCellStyle );
		worksheet.cell( 7, 13 ).string( 'registration' ).style( centeredCellStyle );
		worksheet.cell( 7, 14 ).string( 'homestudy' ).style( centeredCellStyle );
		worksheet.cell( 7, 15 ).string( 'source' ).style( centeredCellStyle );

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

			// fetch the first available phone number, prioritizing mobile over work, and contact 1 over contact 2
			let phone = attendee.get( 'contact1.phone.mobile' )
				|| attendee.get( 'contact1.phone.work' )
				|| attendee.get( 'contact2.phone.mobile' )
				|| attendee.get( 'contact2.phone.work' )
				|| '';

			// fill attendee data in the appropriate cells
			worksheet.cell( row, 1 ).style( cellStyle );
			worksheet.cell( row, 2 ).string( attendee.get( 'contact1.name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'contact1.name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( attendee.get( 'contact2.name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( attendee.get( 'contact2.name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 6 ).string( '?' ).style( cellStyle );
			worksheet.cell( row, 7 ).string( attendee.get( 'address.street1' ) || '' ).style( cellStyle );
			worksheet.cell( row, 8 ).string( attendee.get( 'address.displayCity' ) || '' ).style( cellStyle );
			worksheet.cell( row, 9 ).string( attendee.get( 'address.state' ) ? attendee.get( 'address.state' ).state : '' ).style( cellStyle );
			worksheet.cell( row, 10 ).string( attendee.get( 'address.zipCode' ) || '' ).style( cellStyle );
			worksheet.cell( row, 11 ).string( phone ).style( cellStyle );
			worksheet.cell( row, 12 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 13 ).string( '?' ).style( cellStyle );
			worksheet.cell( row, 14 ).string( attendee.get( 'homestudy.completed' ) ? 'Y' : 'N' ).style( cellStyle );
			worksheet.cell( row, 15 ).string( '?' ).style( cellStyle );		
		}

		resolve();
	});
};

exports.createSocialWorkersWorksheet = ({ event, workbook, attendees, childAttendees, unregisteredChildAttendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Social Workers', exports.getSheetOptions() );

		// get the styles to apply to the content cells and create a reusable style
		const centeredCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Social Workers',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( centeredCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( centeredCellStyle );
		worksheet.cell( 7, 4 ).string( 'bringing' ).style( centeredCellStyle );
		worksheet.cell( 7, 5 ).string( 'agency' ).style( centeredCellStyle );

		// set the row to 1 to begin entering attendee information
		let row = 8;

		// set the fields to populate on the social worker model
		const fieldsToPopulate = [ 'agency' ];

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

			// TODO: this is sloppy as the adoption and recruitment workers were populated in a prior step.  Consider copying the object before populating at each step
			const registeredChildren = childAttendees.filter( child => {
				return ( child.get( 'adoptionWorker' ) && child.get( 'adoptionWorker._id' ).toString() === attendee.get( '_id' ).toString() )
					|| ( child.get( 'recruitmentWorker' ) && child.get( 'recruitmentWorker._id' ).toString() === attendee.get( '_id' ).toString() );
			});
			// get just the registered children with the current social worker set as their adoption worker or recruitment worker
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
			worksheet.cell( row, 4 ).string( allChildNames.join( ', ' ) ).style( cellStyle );
			worksheet.cell( row, 5 ).string( attendee.get( 'agency' ) ? attendee.get( 'agency' ).name : '' ).style( cellStyle );
		}

		resolve();
	});
};

exports.createStaffWorksheet = ({ event, workbook, attendees }) => {
	// create a worksheet and label it
	const worksheet = workbook.addWorksheet( 'Staff', exports.getSheetOptions() );

	// get the styles to apply to the content cells and create a reusable style
	const centeredCellStyleOptions = exports.getCellStyle({
		options: {
			border: true,
			centered: true
		}
	});

	const cellStyleOptions = exports.getCellStyle({
		options: {
			border: true,
			leftAligned: true
		}
	});

	const cellStyle = workbook.createStyle( cellStyleOptions );
	const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

	// add the event header information to the worksheet
	exports.appendEventHeader({
		event,
		workbook,
		worksheet,
		label: 'Staff',
		attendeeCount: attendees.length
	});

	// create the column headers
	worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
	worksheet.cell( 7, 2 ).string( 'first name' ).style( centeredCellStyle );
	worksheet.cell( 7, 3 ).string( 'last name' ).style( centeredCellStyle );
	worksheet.cell( 7, 4 ).string( 'email' ).style( centeredCellStyle );
	worksheet.cell( 7, 5 ).string( 'phone' ).style( centeredCellStyle );
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
		// increment the row data will be written to
		row++;
	}
}

exports.createSiteVisitorsWorksheet = ({ event, workbook, attendees }) => {

	return new Promise( async ( resolve, reject ) => {
		// create a worksheet and label it
		const worksheet = workbook.addWorksheet( 'Site Visitors', exports.getSheetOptions() );

		// get the styles to apply to the content cells and create a reusable style
		const centeredCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({
			event,
			workbook,
			worksheet,
			label: 'Site Visitors',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
		worksheet.cell( 7, 2 ).string( 'first name' ).style( centeredCellStyle );
		worksheet.cell( 7, 3 ).string( 'last name' ).style( centeredCellStyle );
		worksheet.cell( 7, 4 ).string( 'email' ).style( centeredCellStyle );
		worksheet.cell( 7, 5 ).string( 'phone' ).style( centeredCellStyle );
		worksheet.cell( 7, 6 ).string( 'city' ).style( centeredCellStyle );
		worksheet.cell( 7, 7 ).string( 'state' ).style( centeredCellStyle );
		
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
			// create a variable to store the site visitor's city
			let city;

			// if the attendee is outside Massachusetts, the city will be entered in the free text field
			if( attendee.get( 'address.isOutsideMassachusetts' ) ) {    
				city = attendee.get( 'address.cityText' );
			// if the attendee is in Massachusetts, the city will be a relationship field that we need to fetch
			} else {
				// fetch the city model and extract the name of the city or town
				try {
					const cityModel = await listService.getCityOrTownById( attendee.get( 'address.city' ).toString() );
					city = cityModel.get( 'cityOrTown' );
				}
				catch( error ) {
					console.error( `error fetching city for site visitor ${ attendee.get( 'name.full' ) } - ${ error }` );
				}
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
			worksheet.cell( row, 2 ).string( attendee.get( 'name.first' ) || '' ).style( cellStyle );
			worksheet.cell( row, 3 ).string( attendee.get( 'name.last' ) || '' ).style( cellStyle );
			worksheet.cell( row, 4 ).string( attendee.get( 'email' ) || '' ).style( cellStyle );
			worksheet.cell( row, 5 ).string( phone || '' ).style( cellStyle );
			worksheet.cell( row, 6 ).string( city || '' ).style( cellStyle );
			worksheet.cell( row, 7 ).string( state || '' ).style( cellStyle );
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
		const centeredCellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				centered: true
			}
		});

		const cellStyleOptions = exports.getCellStyle({
			options: {
				border: true,
				leftAligned: true
			}
		});

		const cellStyle = workbook.createStyle( cellStyleOptions );
		const centeredCellStyle = workbook.createStyle( centeredCellStyleOptions );

		// add the event header information to the worksheet
		exports.appendEventHeader({ event,
			workbook,
			worksheet,
			label: 'Outside Contacts',
			attendeeCount: attendees.length
		});

		// create the column headers
		worksheet.cell( 7, 1 ).string( 'attended' ).style( centeredCellStyle );
		worksheet.cell( 7, 2 ).string( 'name' ).style( centeredCellStyle );
		worksheet.cell( 7, 3 ).string( 'email' ).style( centeredCellStyle );
		worksheet.cell( 7, 4 ).string( 'phone' ).style( centeredCellStyle );
		worksheet.cell( 7, 5 ).string( 'city' ).style( centeredCellStyle );
		worksheet.cell( 7, 6 ).string( 'state' ).style( centeredCellStyle );
		
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

	let styles = {};

	if( options.centered ) {
		styles.alignment = {
			horizontal: 'center',
			vertical: 'center'
		};
	}

	if( options.leftAligned ) {
		styles.alignment = {
			horizontal: 'left'
		};
	}

	if( options.bold ) {
		styles.font = { bold: true };
	}

	if( options.border ) {
		styles.border = {
			left: { style: 'thin' },
			right: { style: 'thin' },
			top: { style: 'thin' },
			bottom: { style: 'thin' }
		};
	}

	return styles;
};

exports.getSheetOptions = ( options = {} ) => {
	return {
		'sheetFormat': {
			'defaultColWidth': options.cellWidth === 'small' ? 16 : 28,
			'defaultRowHeight': 28
		},
		'printOptions': {
			'centerHorizontal': true,
			'centerVertical': true,
			// 'printGridLines': true,
			'printHeadings': true
	
		}
	};
};