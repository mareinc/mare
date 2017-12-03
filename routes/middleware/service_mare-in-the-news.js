const keystone		= require( 'keystone' ),
      MAREInTheNews	= keystone.list( 'MARE in the News' );

exports.getAllMAREInTheNewsStories = () => {

    return new Promise( ( resolve, reject ) => {
        // query the database for all mare in the news models
        MAREInTheNews.model
            .find()
            .exec()
            .then( stories => {
                // if no stories could be found
                if( stories.length === 0 ) {
                    // log an error for debugging purposes
                    console.error( `no MARE in the news stories could be found` );
                    // reject the promise
                    return reject();
                }
                // if stories were returned, resolve with the array
                resolve( stories );
            // if an error was encountered fetching from the database
            }, err => {
                // log the error for debugging purposes
                console.error( `error fetching all MARE in the news stories - ${ err }` );
                // reject the promise
                reject();
            });
    });
};

exports.getMAREInTheNewsStoryByKey = key => {

    return new Promise( ( resolve, reject ) => {
        // query the database for a mare in the news model matching the provided key
        MAREInTheNews.model
            .findOne()
            .where( 'key', key )
            .lean()
            .exec()
            .then( story => {
                // if we can't find the story, abort execution and resolve with an undefined value
				if( !story ) {
					console.log( `no MARE in the news story was found matching the key: ${ key }` );
					return resolve();
				}
                // if the story was successfully returned, resolve with the model	
                resolve( story );
            // if an error was encountered fetching from the database
            }, err => {
                // log the error for debugging purposes
                console.error( `error fetching the MARE in the news story with key ${ key } - ${ err }` );
                // reject the promise
                reject();
            });
    });
};