const cronJob = require( 'cron' ).CronJob,
	  eventService = require( '../routes/middleware/service_event' ),
	  childService = require( '../routes/middleware/service_child' ),
	  socialWorkerService = require( '../routes/middleware/service_social-worker' ),
	  agencyService = require( '../routes/middleware/service_agency' );

exports.scheduleEventDeactivator = () => {
	// don't do anything if the chron job is turned off via environment variables
	if( process.env.RUN_EVENT_DEACTIVATION_CHRON_JOB === 'true' ) {
		// run the task every hour
		new cronJob( '00 00 * * * *', async () => {

			console.log( 'chron - beginning scheduled task to deactivate events that have passed' );

			try {
				const pastEvents = await eventService.getPastEvents();

				await eventService.deactivateEvents( pastEvents );
			}
			catch( err ) {
				console.error( `error running scheduled task to deactivate events that have passed - ${ err }` );
			}

			console.log( 'chron - completed scheduled task to deactivate events that have passed' );

		}, null, true, 'America/New_York' );
	}
};

exports.scheduleModelSaver = () => {
	// don't do anything if the chron job is turned off via environment variables
	if( process.env.RUN_MODEL_SAVING_CHRON_JOB === 'true' ) {
		// run the task every night at 2:30 AM EST
		new cronJob( '00 30 2 * * *', async () => {

			console.log( 'chron - beginning scheduled task to save models' );

			try {
				await agencyService.saveAllAgencies();
				await socialWorkerService.saveAllSocialWorkers();
				await childService.saveAllChildren();
			}
			catch( err ) {
				console.error( `error running scheduled task to save models - ${ err }` );
			}

			console.log( 'chron - completed scheduled task to save models' );

		}, null, true, 'America/New_York' );
	}
};