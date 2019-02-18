const cronJob = require( 'cron' ).CronJob,
      eventService = require( '../routes/middleware/service_event' );

exports.scheduleEventDeactivator = () => {
	// run the task every hour
	new cronJob( '00 00 * * * *', async () => {

    	console.log( 'chron - beginning scheduled task to deactivate events that have passed' );

    	try {
			await eventService.checkForOldEvents();
		}
		catch( err ) {
			console.error( `error running scheduled task to deactivate events that have passed - ${ err }` );
		}

		console.log( 'chron - completed scheduled task to deactivate events that have passed' );

  	}, null, true, 'America/New_York' );
};