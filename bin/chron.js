const cronJob = require( 'cron' ).CronJob,
	  eventService = require( '../routes/middleware/service_event' ),
	  listService = require( '../routes/middleware/service_lists' );

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
				await listService.saveAllAgencies();
				await listService.saveAllSocialWorkers();
				await listService.saveAllChildren();
			}
			catch( err ) {
				console.error( `error running scheduled task to save models - ${ err }` );
			}

			console.log( 'chron - completed scheduled task to save models' );

		}, null, true, 'America/New_York' );
	}
};