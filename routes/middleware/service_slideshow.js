const keystone		= require( 'keystone' ),
	  Slideshow		= keystone.list( 'Slideshow' ),
	  SlideshowItem	= keystone.list( 'Slideshow Item' );

/* fetch the requested slideshow, default to 'Main Page Slideshow' if no name was provided */
exports.fetchSlideshow = ( { title = 'Main Page Slideshow' } ) => {
	// return a promise for cleaner asynchronous processing
	return new Promise( ( resolve, reject ) => {
		// fetch the model specified in the field using it's _id value
		Slideshow.model
				.findOne()
				.where( 'title', title )
				.exec()
				.then( slideshow => {
					// if we can't find the slideshow, abort execution and resolve with an undefined value
					if( !slideshow ) {
						console.log( `unable to load the slideshow: ${ title }` );
						return resolve();
					}					
					// resolve with the _id of slideshow for easy access furthur down the line
					resolve( slideshow.get( '_id' ) );

				}, err => {
					// if there was an error while fetching the model, reject the promise and return the error 
					reject( err );
				});
	});
};

exports.fetchSlides = ( { slideshowId } ) => {
	// return a promise for cleaner asynchronous processing
	return new Promise( ( resolve, reject ) => {

		SlideshowItem.model.find()
				.where( 'parent', slideshowId )
				.exec()
				.then( slides => {
					// if we can't find the slides, abort execution and resolve with an undefined value
					if( !slides ) {
						console.log( `unable to load the slideshow slides` );
						return resolve();
					}
					// resolve with the slides for easy access furthur down the line
					resolve( slides );

				}, err => {
					// if there was an error while fetching the model, reject the promise and return the error 
					reject( err );
				});

	});
}