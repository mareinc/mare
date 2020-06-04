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

exports.getNumberOfModelsByDatesAndDateFieldName = ( modelName, fromDate, toDate, dateFieldName ) => {
	return new Promise( ( resolve, reject ) => {
		keystone.list( modelName ).model
			.count({
				[ dateFieldName ] : { "$gte": new Date( fromDate + "T00:00:00.000Z" ), "$lte": new Date( toDate + "T00:00:00.000Z" ) }
			})
			.exec()
			.then( total => {
				resolve( total );
			}, err => {
				reject( new Error( `error fetching the number of models ${ modelName } by dates and date field name - ${ err }` ) );
			});
	});
};

// enables fields on models to be required dynamically based on the values of other fields
/* requirements structure
	[{
		condition: { path: 'path.to.field', value: 'value when required' },
		requiredFields: [ { path: 'path.to.field', type: FieldType }, ... ]
	},
	...]
*/
exports.validateDynamicRequiredFields = function validateDynamicRequiredFields( model, requirements = [] ) {
	
	// iterate through each requirement and ensure it's valid
	for ( const requirement of requirements ) {
		
		// check to see if the dynamic require condition has been met
		if ( model.get( requirement.condition.path ) == requirement.condition.value ) {

			// check each of the required fields of the dynamic condition
			for ( const requiredField of requirement.requiredFields ) {

				// determine the empty state to check against based on the field type
				let emptyState;
				switch( requiredField.type ) {
					case 'text':
						emptyState = '';
						break;
					case 'relationship-single':
						emptyState = null;
						break;
					default:
						emptyState = undefined;
				}

				// get the current value of the required field
				let requiredFieldValue = model.get( requiredField.path );
				// ensure the required field has a value
				if ( requiredFieldValue === undefined || requiredFieldValue === emptyState ) {
					throw new Error( `${ requiredField.path } is a required field.` );
				}
			}
		}
	}
};

// NOTE: The functions below allow locking of Models while they are being saved to prevent multiple saves from occuring simultaneously

// creates a private Set to store all locked models
let _lockedModels = new Set();

/* locks a model */
exports.lock = modelId => {
	_lockedModels.add( modelId );
};

/* unlocks a model */
exports.unlock = modelId => {
	_lockedModels.delete( modelId );
};

/* returns the status of a model */
exports.isLocked = modelId => {
	return _lockedModels.has( modelId );
};