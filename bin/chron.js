const cronJob = require( 'cron' ).CronJob,
      eventService = require( '../routes/middleware/service_event' );

exports.scheduleEventDeactivator = () => {
	// run the task every hour
	new cronJob( '00 00 * * * *', () => {

    	console.log( 'chron - beginning task to deactivate events that have passed' );

    	eventService.checkForOldEvents();

  	}, null, true, 'America/New_York' );
};