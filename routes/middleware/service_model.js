const keystone = require( 'keystone' );

exports.getModel = query = ( { id, targetModel, fieldsToSelect = [], fieldsToPopulate = [] } ) => {
	return new Promise( ( resolve, reject ) => {
        // if no id or target model were provided, no model can be fetched
		if( !id || !targetModel ) {
			return resolve();
		}

		keystone.list( targetModel ).model
            .findById( id )
			.select( fieldsToSelect )
			.populate( fieldsToPopulate )
			.exec()
			.then( model => {
				resolve( model );
			})
			.catch( err => {
				reject( new Error( `error fetching model` ) );
			});
	});
};

exports.getModels = query = ( { ids, targetModel, fieldsToSelect = [], fieldsToPopulate = [] } ) => {
	return new Promise( ( resolve, reject ) => {
        // if no ids or target model were provided, no models can be fetched
		// return an empty results array to prevent promise chains relying on the results from failing
		// NOTE: ids is expected to be an array, but will fail on any falsey value or empty array
		if( !ids || ( Array.isArray( ids ) && ids.length === 0 ) || !targetModel ) {
			return resolve( [] );
		}

		keystone.list( targetModel ).model
            .find()
            .where( '_id' ).in( ids )
			.select( fieldsToSelect )
			.populate( fieldsToPopulate )
			.exec()
			.then( models => {
				resolve( models );
			})
			.catch( err => {
				reject( new Error( `error fetching models` ) );
			});
	});
};
