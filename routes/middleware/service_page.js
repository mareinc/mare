const keystone				= require( 'keystone' ),
	  moment				= require( 'moment' ),
	  Page					= keystone.list('Page'),
	  Utils					= require( './utilities' ),
	  eventService			= require( './service_event' ),
	  successStoryService	= require( './service_success-story' );

exports.getPageByKey = key => {

	return new Promise( ( resolve, reject ) => {
		// query the database a single page model matching the passes in key
		Page.model.findOne()
			.where( 'key', key )
			.lean()
			.exec()
			.then( page => {
				// if the target page could not be found
				if( !page ) {
					// log an error for debugging purposes
					console.error( `no page matching key '${ key } could be found` );
					// reject the promise
					return reject();
				}
				// if the target page was found, resolve the promise with the lean version of the object
				resolve( page );
				// if there was an error fetching from the database
				}, err => {
					// log an error for debugging purposes
					console.error( `error fetching page matching url ${ key } - ${ err }` );
					// and reject the promise
					reject();
				});
		});
};

exports.getSidebarItems = () => {

	return new Promise( ( resolve, reject ) => {
		// set how the text will be truncated for short content displays
		const truncateOptions = { targetLength: 100 }
		// fetch the random success story and event to display in the sidebar
		let fetchRandomSuccessStory	= successStoryService.getRandomStory(),
			fetchRandomEvent		= eventService.getRandomEvent();
		// once the promises for each fetch have resolved
		Promise.all( [ fetchRandomSuccessStory, fetchRandomEvent ] )
			.then( values => {
				// assign local variables to the values returned by the promises
				const [ successStory, event ] = values;
				// if a success story was returned
				if( successStory ) {
					// create a truncated content element for a nicer display in summary cards
					successStory.shortContent = Utils.truncateText( successStory.content, truncateOptions );
				}
				// create a formatted date for display in the UI
				event.prettyDate = moment( event.date ).format( 'dddd, MMMM Do' );
				// truncated content and remove HTML tags from the description, storing the result in a new field
				event.shortDescription = Utils.truncateText( Utils.stripTags( event.description ), truncateOptions );
				// resolve the promise with the fetched success story and event
				resolve( [ successStory, event ] );
			})
			// if any of the promises were rejected
			.catch( err => {
				// log the error for debugging purposes
				console.error( `error fetching items to render the sidebar` );
				// reject the promise
				reject();
			})
	});
};
