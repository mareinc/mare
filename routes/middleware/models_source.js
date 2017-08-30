require( '../../models/List_Source' );

const keystone	= require( 'keystone' );
const Source	= keystone.list( 'Source' );

exports.createSource = ( sourceName ) => {
	// return a promise around the creation of the new source
	return new Promise( ( resolve, reject ) => {
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
			// log the error for debugging purposes
			console.error( `error saving the new source model - ${ err }` );
			// reject the promise
			reject();
		});
	});
};

exports.updateSource = ( sourceId, sourceName ) => {
	// return a promise around the updating of the existing source record
	return new Promise( ( resolve, reject ) => {
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
						// log the error for debugging purposes
						console.error( `error saving the updated source model - ${ err }` );
						// reject the promise
						reject();
					});
				}
			// TODO [ IMPORTANT ]: add error handling for all find() and findById() calls throughout the codebase
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the source model to update - ${ err }` );
				// reject the promise
				reject();
			});
	});
}