const cronJob = require( 'cron' ).CronJob,
      keystone = require( 'keystone' ),
      moment = require( 'moment' ),
	  eventService = require( '../components/events/event.controllers' ),
	  childService = require( '../components/children/child.controllers' ),
	  socialWorkerService = require( '../components/social workers/social-worker.controllers' ),
	  agencyService = require( '../components/agencies/agency.controllers' ),
	  listService = require( '../components/lists/list.controllers' ),
	  eventEmailMiddleware = require( '../components/events/event.email.controllers' ),
	  staffEmailContactMiddleware = require( '../components/staff email contacts/staff-email-contact.controllers' ),
      reportingDashboardService = require( '../components/reporting dashboard/dashboard.controllers' );

exports.scheduleEventDeactivator = () => {
	// don't do anything if the cron job is turned off via environment variables
	if( process.env.RUN_EVENT_DEACTIVATION_CRON_JOB === 'true' ) {
		// run the task every hour
		new cronJob( '00 00 * * * *', async () => {

			console.log( 'cron - beginning scheduled task to deactivate events that have passed' );

			try {
				const pastEvents = await eventService.getPastEvents();

				await eventService.deactivateEvents( pastEvents );
			}
			catch( err ) {
				console.error( `error running scheduled task to deactivate events that have passed`, err );
			}

			console.log( 'cron - completed scheduled task to deactivate events that have passed' );

		}, null, true, 'America/New_York' );
	}
};

exports.scheduleModelSaver = () => {
	// don't do anything if the cron job is turned off via environment variables
	if( process.env.RUN_MODEL_SAVING_CRON_JOB === 'true' ) {
		// run the task every night at 2:30 AM EST
		new cronJob( '00 30 2 * * *', async () => {

			console.log( 'cron - beginning scheduled task to save models' );

			try {
				const agencySaveResults = await agencyService.saveAllAgencies();
				const socialWorkerSaveResults = await socialWorkerService.saveAllSocialWorkers();
				const childSaveResults = await childService.saveAllChildren();

				// send an email to the appropriate staff contact if there were errors saving any of the records
				if( agencySaveResults.status === 'errors'
					|| socialWorkerSaveResults.status === 'errors'
					|| childSaveResults.status === 'errors'
				) {
					try {
						// fetch the email targets model matching 'cron job errors'
						const emailTarget = await listService.getEmailTargetByName( 'cron job errors' );
						// fetch contact info for the staff contacts for 'cron job errors'
						const staffEmailContacts = await staffEmailContactMiddleware.getStaffEmailContactsByEmailTarget({
							emailTargetId: emailTarget.get( '_id' ),
							fieldsToPopulate: [ 'staffEmailContact' ]
						});
						// set the contact details from the returned objects if any were retrieved
						const staffEmailContactsInfo = staffEmailContacts.length > 0
							? staffEmailContacts.map( contact => contact.staffEmailContact.email )
							: null;

						eventEmailMiddleware.sendCronJobErrorsEmailToMARE({
							staffContactEmails: staffEmailContactsInfo,
							agencyErrors: agencySaveResults.errors,
							socialWorkerErrors: socialWorkerSaveResults.errors,
							childErrors: childSaveResults.errors
						});
					}
					catch( err ) {
						console.error( `error sending email notification about model saving cron job errors`, err );
					}
				}
			}
			catch( err ) {
				console.error( `error running scheduled task to save models`, err );
			}

			console.log( 'cron - completed scheduled task to save models' );

		}, null, true, 'America/New_York' );
	}
};

exports.scheduleDailyReportGenerator = () => {

    // don't do anything if the cron job is turned off via environment variables
	if( process.env.RUN_DAILY_REPORT_CRON_JOB === 'true' ) {

        // run the task every night at 12:00:05 AM EST
		new cronJob( '05 00 00 * * *', () => {

            console.log( 'cron - beginning scheduled task to generate a daily child report' );

            // get the child counts for each region
            reportingDashboardService.getChildrenNumbersGroupedByRegions()
                .then( regionalChildCounts => {

                    // save the regional counts and get the total count of children visible on the website
                    return Promise.all([
                        reportingDashboardService.saveRegionalChildCounts( regionalChildCounts ),
                        keystone.list( 'Child' )
                            .model
                            .find({ isVisibleInGallery: true })
                            .lean()
                            .exec()
                    ]);
                })
                .then( results => {

                    // destructure results
                    const [ regionalCountDocs, visibleChildrenDocs ] = results;
                    
                    // create and save a Daily Child Count model
                    return keystone.list( 'Daily Child Count' )
                        .model({
                            date: moment.utc().startOf( 'day' ).subtract( 1, 'day' ),
                            regionalCounts: regionalCountDocs.map( regionalCountDoc => regionalCountDoc._id ),
                            totalActiveProfiles: visibleChildrenDocs.length,
                            totalProfilesVisibleToAll: visibleChildrenDocs.filter( visibleChild => visibleChild.siteVisibility === 'everyone' ).length
                        })
                        .save();
                })
                .then( () => console.log( 'cron - completed scheduled task to generate a daily child report' ) )
                .catch( error => {
                    console.error( 'error running scheduled task to generate a daily child report' );
                    console.error( error );
                });

        }, null, true, 'America/New_York' );
    }
};
