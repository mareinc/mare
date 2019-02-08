const keystone = require( 'keystone' );

module.exports.fixEvents = async ( req, res, next ) => {

  // if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_family.js and comment out the if block in fixFamilies()` );
  }
  
  keystone.list( 'Event' ).model
    .find()
    .exec()
    .then( async events => {

      let types = events.map( event => {
        return event.type;
      });

      let typesSet = new Set( types );

      for( let type of typesSet.values() ) {
        console.log( type );
      }

      // loop through each event
      for( let event of events ) {
        // assume no update is needed
        let updateNeeded = false;
        // update old values to 'Mare hosted events' and mark the event as needing an update
        if( [ 'MARE adoption parties & information events', 'fundraising events' ].includes( event.type ) ) {
          event.set( 'type', 'Mare hosted events' );
          updateNeeded = true;
        }
        // update old values to 'partner hosted events' and mark the event as needing an update
        if( [ 'agency information meetings', 'other opportunities & trainings' ].includes( event.type ) ) {
          event.set( 'type', 'partner hosted events' );
          updateNeeded = true;
        }
        // if changes were made, save the event with the updated type and pause the loop using async/await
        if( updateNeeded ) {
          
          try {
            await event.save( ( err, savedEvent ) => {
              // log an error if the model couldn't be saved
              if ( err ) {
                throw new Error( `error updating event ${ event.get( 'name' ) } -  ${ err }` );
              }
            });
          }
          catch( err ) {
            console.log( err );
          }
        }
      }     
    }, err => {
      console.error( `error fetching events to fix - ${ err }` );
    });
};