/**
 * Created by Adrian Suciu.
 *
 * This file can't be debugged further until the imports for Child, Family, and Outside Contact are working
 *     as we rely on they _oldId field being populated for each
 *
 * NOTE: note for the csv fetch functions to strip out the header rows.  This can be done with .splice() when
 *       we revisit the file
 */

const async					= require( 'async' );
const keystone				= require( 'keystone' );
const Types 				= keystone.Field.Types;
const Event  				= keystone.list( 'Event' );
const csv2arr				= require( 'csv-to-array' );
const dataMigrationService	= require( '../service_data-migration' );

// define all the column names for each data set we'll be fetching
const columns = [ 'evt_id', 'rcs_id', 'schedule_datetime', 'location', 'directions', 'notes', 'is_active' ];
const columnsRecruitment = [ 'rcs_id', 'name', 'is_media_outlet', 'is_media_outlet_active', 'media_frequency', 'media_type' ];
const columnsEventAttendees = [ 'eva_id', 'evt_id', 'type', 'fam_id', 'chd_id', 'agc_id', 'chd_brought_by_type', 'chd_brought_by_agc_id', 'chd_brought_by_name', 'chd_notes', 'chd_first_name', 'chd_last_name', 'chd_siblings', 'chd_race', 'chd_dob', 'chd_status', 'fam_rgn_id', 'fam_is_home_studied', 'fam_others', 'fam_source', 'fam_registration_type', 'agc_first_name', 'agc_last_name', 'agc_agency', 'agc_phone', 'agc_others', 'agc_assignments' ];

/* the import function for events and event attendees */
module.exports.importEvents = ( req, res, done ) => {
	// create a reference to locals where variables shared across functions will be bound
	let locals = res.locals;
	// execute the set up functions which fetch all the information we need from the new system in series
	//     as some functions rely on data from others
	async.series([
		done => { exports.getVolunteerHash( locals, done ); },		// get the _id value in the new system for the 'volunteer' option for the type field in Outside Contact
		done => { exports.getNewSocialWorkers( locals, done ); },	// fetch all social workers in the new system and store them as locals.newSocialWorkers
		done => { exports.getNewVolunteers( locals, done ); },		// fetch all volunteers in the new system using the volunteer hash we fetched above and store them as locals.newVolunteers
		done => { exports.getNewFamilies( locals, done ); },		// fetch all the families in the new system and store them as locals.newFamiliesArray
		done => { exports.getNewChildren( locals, done ); },		// fetch all the children in the new system ad store them as locals.newChildren
		done => { exports.getMigrationAdmin( locals, done ); }		// fetch the migration admin user which will be used to populate the 'contact' field in events we create as events in the old system didn't have contacts
	], () => {
		// fetch all the event data from the exported csv file
		csv2arr({
			file: './migration-data/csv-data/event.csv',
			columns: columns
		}, ( err, array ) => {
			// process any errors that occur while fetching the file
			if ( err ) {
				throw `An error occurred!
					   ${ err }`;
			// if there are no errors
			} else {
				// NOTE: I stopped working here as we're missing information to proceed, but I don't know what this importArray is used for
				locals.importArray = array;
				// load needed recruitment source and attendee information from additional csv files, and use that information to populate our attendees arrays for each save
				async.series([
					done => exports.loadRecruitmentSources( locals, done ),
					done => exports.loadEventAttendees( locals, done ),
					done => exports.populateContactsArrays( locals, done )
				], () => {

					for ( let i = 0, _count = locals.importArray.length; i <_count; i++ ) {

						let _event	= locals.importArray[ i ],
							_name	= exports.findRecordInArray( _event.rcs_id, locals.recruitmentSourceArray, 0, 1 );

						var _dateTimeArray = exports.splitDateTime( _event.schedule_datetime );

						// populate instance for Event object
						var newEvent = new Event.model({

							name					: _event._name, // map to recruiment_source via the rcs_id on the event table and fetch the name field value
							isActive				: _event.is_active,
							/* Jared will add a checkbox that says the event comes from the old system and i should dump location under a new location textbox */
							address: {
								street1				: _event.address_1,
								street2				: _event.address_2,
								city				: _event.city,
								state				: _event.state,
								zipCode				: _event.zip,
								region				: _event.rgn_id
							},

							contact					: migrationAdminId, // same generic user from the user_admin table (be careful there is a relationship here)

							date					: _dateTimeArray[ 0 ], // take the date and split it and the time goes to startime, and then add 2 hours for the endtime
							startTime				: _dateTimeArray[ 1 ],
							endTime					: exports.increaseHours( _dateTimeArray[ 1 ] ),

							socialWorkerAttendees	: locals.newSocialWorkers,
							familyAttendees			: locals.newFamilies,
							childAttendees			: locals.newChildren,
							outsideContactAttendees	: locals.newVolunteers,
							
							notes					: _event.notes

						});

						// call save method on Event object
						newEvent.save( err => {
							// newEvent object has been saved
							if ( err ) {
								throw `'[ ID# ${ _event.evt_id} ] an error occurred while saving ${ newEvent } object`;
							}
							else {
								console.log( `[ ID# ${ _event.evt_id } ] event successfully saved!`);
							}
						});
					}
				});
			}
		});
	}
)};

/* get the _id value for the Outside Contact Group entry with the name 'volunteers' */
exports.getVolunteerHash = ( locals, done ) => {
	
	keystone.list( 'Outside Contact Group' ).model
			.findOne()
			.where( 'name', 'volunteers' )
			.exec()
			.then( outsideContactGroup => {
				// assign the matching entry to locals for use in other functions
				locals.volunteerHash = outsideContactGroup.get( '_id' );
				// call done() to return the flow of control to the next call in the async() function
				done();

			}, err => {

				console.log( err );
				done();
			});
};

/* get all social workers saved in the new system */
exports.getNewSocialWorkers = ( locals, done ) => {

	keystone.list('Social Worker').model
			.find()
			.exec()
			.then( socialWorkers => {
				// store the social workers in locals for use in other functions
				locals.newSocialWorkers = socialWorkers;
				// call done() to return the flow of control to the next call in the async() function
				done();

			}, err => {

				console.log( err );
				done();
			});
};

/* get all volunteers saved in the new system using the _id value we fetched in getVolunteerHash() */
exports.getNewVolunteers = ( locals, done ) => {

	keystone.list( 'Outside Contact' ).model
			.find()
			.where( 'type', locals.volunteerHash )				// match on the volunteerHash we fetched in getVolunteerHash()
			.exec()
			.then( volunteers => {
				// store the volunteers in locals for use in other functions
				locals.newVolunteers = volunteers;
				// call done() to return the flow of control to the next call in the async() function
				done();

			}, err => {

				console.log( err );
				done();
			});
};

/* get all families saved in the new system */
exports.getNewFamilies = ( locals, done ) => {

	keystone.list( 'Family' ).model
			.find()
			.exec()
			.then( families => {
				// store the families in locals for use in other functions
				locals.newFamilies = families;
				// call done() to return the flow of control to the next call in the async() function
				done();

			}, err => {

				console.log( err );
				done();
			});
};

/* get all children saved in the new system */
exports.getNewChildren = ( locals, done ) => {

	keystone.list( 'Child' ).model
			.find()
			.exec()
			.then( children => {
				// store the children in locals for use in other functions
				locals.newChildren = children;
				// call done() to return the flow of control to the next call in the async() function
				done();

			}, err => {

				console.log( err );
				done();
			});
};

/* get the migration admin user in the new system to populate the contact field in new events */
exports.getMigrationAdmin = ( locals, done ) => {

	keystone.list( 'Admin' ).model
					.findOne()									// there will only be on matching entry
					.where( 'name.full', 'Migration Bot' )		// match the user based on the full name field
					.exec()
					.then( admin => {
						// store the migration admin user in locals for use in other functions
						locals.migrationAdminId = admin.get( '_id' );
						// call done() to return the flow of control to the next call in the async() function
						done();

					}, err => {

						console.log( err );
						done();
					});
};

/* fetch all the recruitment source data from the exported csv file */
exports.loadRecruitmentSources = ( locals, done ) => {

	csv2arr({
		file: './migration-data/csv-data/recruitment_source.csv',
		columns: columnsRecruitment
	},  ( err, array ) => {
		// if an error occurred while fetching
		if ( err ) {
			// thow an error
			throw `An error occurred while fetching recruitment sources:
				   ${ err }`;
		// otherwise
		} else {
			// store the recruitment source data in locals for use in other functions
			locals.recruitmentSourceArray = array;
			// call done() to return the flow of control to the next call in the async() function
			done();
		}
	});
};

/* fetch all the event attendee data from the exported csv file */
exports.loadEventAttendees = ( locals, done ) => {

	csv2arr({
		file: "./migration-data/csv-data/event_attendee.csv",
		columns: columnsEventAttendees
	}, ( err, array ) => {
		// if an error occurred while fetching
		if ( err ) {
			// thow an error
			throw `An error occurred while fetching event attendees:
			${ err }`;
		// otherwise
		} else {
			// store the event attendee data in locals for use in other functions
			locals.eventAttendeesArray = array;
			done();
		}
	});
};

/* take all the event attendees, match them with their entries in the new system, and get the _id values of
 * each entry to ensure the Relationships are bound correctly.  Each group of attendees is stored in their own
 * array to more easily bind them to each event */
exports.populateContactsArrays = ( locals, done ) => {
	// arrays for each type of attendee bound to locals for use in other functions
	locals.childAttendeesArray = [];
	locals.familyAttendeesArray = [];
	locals.socialWorkersArray = [];
	locals.volunteersArray = [];
	// loop through all attendees fetched from the .csv file
	for( let person of locals.eventAttendeesArray ) {
		// if the family id is populated, the entry must be a family
		if ( person.fam_id !== '' ) {
			// find the matching family in the new system
			const familyObject = locals.newFamilies.filter( family => family.get( '_oldId' ) === person.fam_id );
			// extract the family's id
			const familyObjectId = familyObject[ 0 ].get( '_id' );
			// add the family's id to the array of family attendees
			locals.familyAttendeesArray.concat( familyObjectId );
		// otherwise, if the child id is populated, the entry must be a child
		} else if( person.chd_id !== '' ) {
			// find the matching child in the new system
			const childObject = locals.newChildren.filter( child => child.get( '_oldId' ) === person.chd_id );
			// extract the child's id
			const childObjectId = childObject[ 0 ].get( '_id' );
			// add the child's id to the array of child attendees
			locals.childAttendeesArray.concat( childObjectId );
		// otherwise, if the agency id is populated, the entry could either be a social worker or volunteer
		// NOTE: in the old system, anything entry that wasn't a family or child would get an agc_id
		} else if( person.agc_id !== '' ) {
			// find the matching social worker or volunteer in the new system, if there is no match, an empty array
			//     will be assigned
			const socialWorkerObject = locals.newSocialWorkers.filter( socialWorker => socialWorker.get( 'oldId' ) === person.agc_id );
			const volunteerObject = locals.newVolunteers.filter( volunteer => volunteer.get( '_oldId' ) === person.agc_id );
			// if we've found a social worker
			if( socialWorkerObject.length > 0 ) {
				// extract the social worker's id
				const socialWorkerObjectId = socialWorkerObject[ 0 ].get( '_id' );
				// push the social worker's id to the array of social worker attendees
				locals.socialWorkersArray.push( socialWorkerObjectId );
			// otherwise, if we've found a volunteer
			} else if ( volunteerObject.length > 0 ) {
				// extract the volunteer's id
				const volunteerObjectId = volunteerObject.get( '_id' );
				// push the volunteer's id to the array of volunteer attendees
				locals.volunteersArray.push( volunteerObjectId );
			}
		}
	};
	// call done() to return the flow of control to the next call in the async() function
	done();
};

/* NOTE: review and comment this function when we revisit the file */
exports.findRecordInArray = ( needle, haystack, comparatorFieldIndex, returnFieldIndex ) => {

	let _found = '';

	for (let i = 0; i < haystack.length; i++ ) {

		if ( haystack[ i ][ comparatorFieldIndex ] === needle ) {

			_found = haystack[ i ][ returnFieldIndex ];
			
			break;
		}
	}

	return _found;
};

/* takes the data and time as a string and returns an array with the two values separated */
exports.splitDateTime = dateTime => {
	return dateTime.split(' ');
};

/* NOTE: not sure why this is needed, review when we revisit the file */
exports.increaseHours = time => {

	let timeComponents = time.replace( ' AM', '' ).replace( ' PM', '' ).split( ':' );

	timeComponents[ 0 ] = parseInt( timeComponents[ 0 ] ) + 2;

	return timeComponents.join( ':' );
};