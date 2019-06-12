const cronJob = require( 'cron' ).CronJob,
	  eventService = require( '../components/events/event.controllers' ),
	  childService = require( '../components/children/child.controllers' ),
	  socialWorkerService = require( '../components/social workers/social-worker.controllers' ),
	  agencyService = require( '../components/agencies/agency.controllers' ),
	  listService = require( '../components/lists/list.controllers' ),
	  eventEmailMiddleware = require( '../components/events/event.email.controllers' ),
	  staffEmailContactMiddleware = require( '../routes/middleware/service_staff-email-contact' );

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