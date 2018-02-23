const csv									= require( 'csvtojson' ),
	  // migration file locations
	  adminFilePath							= './migration-data/csv-data/app_user.csv',
	  agenciesFilePath						= './migration-data/csv-data/agency.csv',
	  agencyContactsFilePath				= './migration-data/csv-data/agency_contact.csv',
	  childrenFilePath						= './migration-data/csv-data/child.csv',
	  childDisabilitiesFilePath				= './migration-data/csv-data/child_special_need.csv',
	  childHistoriesFilePath				= './migration-data/csv-data/child_h.csv',
	  eventsFilePath						= './migration-data/csv-data/event.csv',
	  eventAttendeesFilePath				= './migration-data/csv-data/event_attendee.csv',
	  familiesFilePath						= './migration-data/csv-data/family.csv',
	  familyChildrenFilePath				= './migration-data/csv-data/family_child.csv',
	  familyContactsFilePath				= './migration-data/csv-data/family_contact.csv',
	  familyDisabilityPreferencesFilePath	= './migration-data/csv-data/family_special_need.csv',
	  familyRacePreferencesFilePath			= './migration-data/csv-data/family_race_preference.csv',
	  familySupportServicesFilePath			= './migration-data/csv-data/family_support_service.csv',
	  inquiriesFilePath						= './migration-data/csv-data/ext_inquiry.csv',
	  callInquiriesFilePath					= './migration-data/csv-data/call.csv',
	  inquiryAgenciesFilePath				= './migration-data/csv-data/call_agency.csv',
	  inquiryChildrenFilePath				= './migration-data/csv-data/call_child.csv',
	  inquiryNotesFilePath					= './migration-data/csv-data/call_note.csv',
	  mailingListSubscriptionsFilePath		= './migration-data/csv-data/mailing_list_subscription.csv',
	  mediaEligibilitiesFilePath			= './migration-data/csv-data/media_eligibility.csv',
	  mediaFeaturesFilePath					= './migration-data/csv-data/media_feature.csv',
	  mediaFeatureChildrenFilePath			= './migration-data/csv-data/media_feature_child.csv',
	  outsideContactsFilePath 				= './migration-data/csv-data/outside_contact.csv',
	  placementsFilePath					= './migration-data/csv-data/family_placement.csv',
	  placementSourcesFilePath				= './migration-data/csv-data/placement_source.csv',
	  recruitmentChecklistsFilePath			= './migration-data/csv-data/recruitment_checklist.csv',
	  sourcesFilePath						= './migration-data/csv-data/recruitment_source.csv',
	  socialWorkersFilePath					= './migration-data/csv-data/agency_contact.csv';


exports.fetchAdmins = () => {
	
	console.log( `fetching admin from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the admin csv file
		csv().fromFile( adminFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', adminArray => {
				console.log( `admin fetched` );
				// resolve the promise with the array of admin objects
				resolve( adminArray );
			})
			.on( 'error', err => {
				console.error( `error fetching admin or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchAgencies = () => {
	
	console.log( `fetching agencies from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the agency csv file
		csv().fromFile( agenciesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', agencyArray => {
				console.log( `agencies fetched` );
				// resolve the promise with the array of agency objects
				resolve( agencyArray );
			})
			.on( 'error', err => {
				console.error( `error fetching agencies or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchAgencyContacts = () => {
	
	console.log( `fetching agency contacts from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the agency contact csv file
		csv().fromFile( agencyContactsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', agencyContactArray => {
				console.log( `agencies fetched` );
				// resolve the promise with the array of agency contact objects
				resolve( agencyContactArray );
			})
			.on( 'error', err => {
				console.error( `error fetching agency contacts or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchChildren = () => {
	
	console.log( `fetching children from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the children csv file
		csv().fromFile( childrenFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', childrenArray => {
				console.log( `children fetched` );
				// resolve the promise with the array of child objects
				resolve( childrenArray );
			})
			.on( 'error', err => {
				console.error( `error fetching children or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchChildDisabilities = () => {
	
	console.log( `fetching child disabilities from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the child disabilities csv file
		csv().fromFile( childDisabilitiesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', disabilitiesArray => {
				console.log( `child disabilities fetched` );
				// resolve the promise with the array of child disability objects
				resolve( disabilitiesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching child disabilities or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchChildHistories = () => {
	
	console.log( `fetching child histories from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the child histories csv file
		csv().fromFile( childHistoriesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', childHistoriesArray => {
				console.log( `child histories fetched` );
				// resolve the promise with the array of child history objects
				resolve( childHistoriesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching child histories or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchEvents = () => {
	
	console.log( `fetching events from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the events csv file
		csv().fromFile( eventsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', eventsArray => {
				console.log( `events fetched` );
				// resolve the promise with the array of event objects
				resolve( eventsArray );
			})
			.on( 'error', err => {
				console.error( `error fetching events or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchEventAttendees = () => {
	
	console.log( `fetching event attendees from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the event attendees csv file
		csv().fromFile( eventAttendeesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', eventAttendeesArray => {
				console.log( `eventAttendees fetched` );
				// resolve the promise with the array of event objects
				resolve( eventAttendeesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching event attendees or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilies = () => {
	
	console.log( `fetching families from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the families csv file
		csv().fromFile( familiesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familiesArray => {
				console.log( `families fetched` );
				// resolve the promise with the array of family objects
				resolve( familiesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching families or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilyChildren = () => {
	
	console.log( `fetching family children from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the family children csv file
		csv().fromFile( familyChildrenFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familyChildrenArray => {
				console.log( `family children fetched` );
				// resolve the promise with the array of family children objects
				resolve( familyChildrenArray );
			})
			.on( 'error', err => {
				console.error( `error fetching family children or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilyContacts = () => {
	
	console.log( `fetching family contacts from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the family contacts csv file
		csv().fromFile( familyContactsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familyContactsArray => {
				console.log( `family contacts fetched` );
				// resolve the promise with the array of family contacts objects
				resolve( familyContactsArray );
			})
			.on( 'error', err => {
				console.error( `error fetching family contacts or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilyDisabilityPreferences = () => {
	
	console.log( `fetching family disability preferences from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the family disability preferences csv file
		csv().fromFile( familyDisabilityPreferencesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familyDisabilityPreferencesArray => {
				console.log( `family disability preferences fetched` );
				// resolve the promise with the array of family disability preference objects
				resolve( familyDisabilityPreferencesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching family disability preferences or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilyRacePreferences = () => {
	
	console.log( `fetching family race preferences from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the family race preferences csv file
		csv().fromFile( familyRacePreferencesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familyRacePreferencesArray => {
				console.log( `family race preferences fetched` );
				// resolve the promise with the array of family race objects
				resolve( familyRacePreferencesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching family race preferences or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchFamilySupportServices = () => {
	
	console.log( `fetching family support services from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the family support services csv file
		csv().fromFile( familySupportServicesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', familySupportServicesArray => {
				console.log( `family support services fetched` );
				// resolve the promise with the array of family support service objects
				resolve( familySupportServicesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching family support services or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchInquiries = () => {
	
	console.log( `fetching inquiries from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the extranet inquiry csv file
		csv().fromFile( inquiriesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', inquiriesArray => {
				console.log( `inquiries fetched` );
				// resolve the promise with the array of inquiry objects
				resolve( inquiriesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching inquiries or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchCallInquiries = () => {
	
	console.log( `fetching call inquiries from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the call inquiries csv file
		csv().fromFile( callInquiriesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', inquiriesArray => {
				console.log( `call inquiries fetched` );
				// resolve the promise with the array of event objects
				resolve( inquiriesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching call inquiries or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchInquiryAgencies = () => {
	
	console.log( `fetching inquiry agencies from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the inquiry agencies csv file
		csv().fromFile( inquiryAgenciesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', inquiryAgenciesArray => {
				console.log( `inquiry agencies fetched` );
				// resolve the promise with the array of event objects
				resolve( inquiryAgenciesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching inquiry agencies or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchInquiryChildren = () => {
	
	console.log( `fetching inquiry children from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the inquiry children csv file
		csv().fromFile( inquiryChildrenFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', inquiryChildrenArray => {
				console.log( `inquiry children fetched` );
				// resolve the promise with the array of event objects
				resolve( inquiryChildrenArray );
			})
			.on( 'error', err => {
				console.error( `error fetching inquiry children or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchInquiryNotes = () => {
	
	console.log( `fetching inquiry notes from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the inquiry notes csv file
		csv().fromFile( inquiryNotesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', inquiryNotesArray => {
				console.log( `inquiry notes fetched` );
				// resolve the promise with the array of event objects
				resolve( inquiryNotesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching inquiry notes or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchMailingListSubscriptions = () => {

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the mailing list subscribers csv file
		csv().fromFile( mailingListSubscriptionsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', mailingListSubscribersArray => {
				console.log( `mailing list subscribers fetched` );
				// resolve the promise with the array of event objects
				resolve( mailingListSubscribersArray );
			})
			.on( 'error', err => {
				console.error( `error fetching mailing list subscribers or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchMediaEligibilities = () => {
	
	console.log( `fetching media eligibilities from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the media eligibilities csv file
		csv().fromFile( mediaEligibilitiesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', mediaEligibilitiesArray => {
				console.log( `media eligibilities fetched` );
				// resolve the promise with the array of media eligibility objects
				resolve( mediaEligibilitiesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching media eligibilities or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchMediaFeatures = () => {
	
	console.log( `fetching media features from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the media features csv file
		csv().fromFile( mediaFeaturesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', mediaFeaturesArray => {
				console.log( `media features fetched` );
				// resolve the promise with the array of media feature objects
				resolve( mediaFeaturesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching media features or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchMediaFeatureChildren = () => {
	
	console.log( `fetching media feature children from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the media feature children csv file
		csv().fromFile( mediaFeatureChildrenFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', mediaFeatureChildrenArray => {
				console.log( `media feature children fetched` );
				// resolve the promise with the array of media feature child objects
				resolve( mediaFeatureChildrenArray );
			})
			.on( 'error', err => {
				console.error( `error fetching media feature children or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchOutsideContacts = () => {
	
	console.log( `fetching outside contacts from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the extranet inquiry csv file
		csv().fromFile( outsideContactsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', outsideContactsArray => {
				console.log( `outside contact groups fetched` );
				// resolve the promise with the array of outside contact objects
				resolve( outsideContactsArray );
			})
			.on( 'error', err => {
				console.error( `error fetching outside contacts or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchPlacements = () => {
	
	console.log( `fetching placements from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the placements csv file
		csv().fromFile( placementsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', placementsArray => {
				console.log( `placements fetched` );
				// resolve the promise with the array of placement objects
				resolve( placementsArray );
			})
			.on( 'error', err => {
				console.error( `error fetching placements or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchPlacementSources = () => {

	console.log( `fetching placement sources from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the placements csv file
		csv().fromFile( placementSourcesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', placementSourcesArray => {
				console.log( `placement sources fetched` );
				// resolve the promise with the array of placement objects
				resolve( placementSourcesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching placement sources or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchRecruitmentChecklistItems = () => {
	
	console.log( `fetching recruitment checklists from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the recruitment checklists csv file
		csv().fromFile( recruitmentChecklistsFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', recruitmentChecklistsArray => {
				console.log( `recruitment checklists fetched` );
				// resolve the promise with the array of recruitment checklist objects
				resolve( recruitmentChecklistsArray );
			})
			.on( 'error', err => {
				console.error( `error fetching recruitment checklists or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchSocialWorkers = () => {
	
	console.log( `fetching social workers from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the extranet social worker csv file
		csv().fromFile( socialWorkersFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', socialWorkersArray => {
				console.log( `social workers fetched` );
				// resolve the promise with the array of social worker objects
				resolve( socialWorkersArray );
			})
			.on( 'error', err => {
				console.error( `error fetching social workers or converting to JSON => ${ err }` );
				reject();
			});
	});
};

exports.fetchSources = () => {
	
	console.log( `fetching sources from CSV` );

	return new Promise( ( resolve, reject ) => {
		// fetch all records from the sources csv file
		csv().fromFile( sourcesFilePath )
			// wait until the whole file has been parsed into an array of objects
			.on( 'end_parsed', sourcesArray => {
				console.log( `sources fetched` );
				// resolve the promise with the array of source objects
				resolve( sourcesArray );
			})
			.on( 'error', err => {
				console.error( `error fetching sources or converting to JSON => ${ err }` );
				reject();
			});
	});
};