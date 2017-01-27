var _ 					= require( 'underscore' ),
	keystone 			= require( 'keystone' );

exports.getModelId = ( options, done ) => {
	'use strict';

	keystone.list( options.model ).model.findOne()
		.where( options.field, options.value )
		.exec()
		.then( model => {
			// if no model was found
			if( !model ) {
				// log the issue
				console.error( `model matching ${ options.value } couldn't be found` );
				// and move on
				return done();
			}
			// loop through each passed in value to map to this model
			for( let id of options.mapTo ) {
				// and store a reference on the namespace
				options.namespace[ id ] = model._id;
			}
			
			done();

		}, err => {

			console.error( `error in getModelId() ${ err }` );
			done();
		});
};

exports.mapModelFields = function( options, done ) {
	'use strict'

	keystone.list( options.model ).model.find()
			.populate( options.populateField )
			.exec()
			.then( models => {
				// if no models were found
				if( !models ) {
					// log the issue
					console.error( `models matching ${ options.model } couldn't be found` );
					// and move on
					return done();
				}
				// loop over each returned model
				for( let model of models ) {
					// and save the key / value pair specified in the passed in options
					options.namespace[ model[ options.keyField ] ] = model[ options.valueField ];
				}
				
				done();

			}, err => {

			console.error( `error in mapModelFields() ${ err }` );
			done();
		});
}