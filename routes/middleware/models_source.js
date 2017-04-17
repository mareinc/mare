require( '../../models/List_Source' );

const keystone	= require( 'keystone' );
const Source	= keystone.list( 'Source' );

exports.createSource = ( sourceName ) => {
	// create a promise around the creation of the new source
	let createSource = new Promise( ( resolve, reject ) => {
		// create a new source
		var newSource = new Source.model({
			source: sourceName,
			type: 'event',
			isActive: true
		});
		// save the new source
		newSource.save( () => {
			// resolve the promise with the new source id
			resolve( newSource.get( '_id' ) );
		// if an error occurs while saving the new source
		}, err => {
			// reject the promise, returning the full error object
			reject( `error saving the new source model` );
		});
	});
	// return the promise to allow the calling function to process the results
	return createSource;
};

exports.updateSource = ( sourceId, sourceName ) => {
	// create a promise around the updating of the existing source record
	let updateSource = new Promise( ( resolve, reject ) => {
		// fetch the source record
		Source.model.findById( sourceId )
			.exec()
			.then( source => {
				// if the name for the source doesn't need to be updated
				if( source.source === sourceName ) {
					// resolve the promise
					resolve( sourceId );
				// if the name for the source needs to be updated
				} else {
					// update the source field
					source.source = sourceName;
					// and save the source
					source.save( () => {
						// if the source saved successfully, resolve the promise with the source id
						resolve( sourceId );
					// but if there was an error while saving the source
					}, err => {
						// reject the promise with an explanation of why
						reject( `error saving the updated source model` );
					});
				}
			// TODO [ IMPORTANT ]: add error handling for all find() and findById() calls throughout the codebase
			}, err => {
				reject( `error fetching the source model to update` );
			});
	});
	// return the promise to allow the calling function to process the results
	return updateSource;
}