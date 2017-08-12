const keystone		= require( 'keystone' ),
      MAREInTheNews	= keystone.list( 'MARE in the News' );

exports.getMAREInTheNewsByUrl = url => {

    return new Promise( ( resolve, reject ) => {
        // query the database for all region models
        MAREInTheNews.model
            .findOne()
            .where( 'url', url )
            .exec()
            .then( story => {
                // if we can't find the story, abort execution and resolve with an undefined value
				if( !story ) {
					console.log( `no MARE in the news story was found matching the url: ${ url }` );
					return resolve();
				}
                // if the story was successfully returned, resolve with the model	
                resolve( story );
            // if an error was encountered fetching from the database
            }, err => {
                // log the error for debugging purposes
                console.error( `error fetching the MARE in the news story with url ${ url } - ${ err }` );
                // reject the promise
                reject();
            });
    });
};