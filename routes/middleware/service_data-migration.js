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

exports.getModelMap = function( done, options ) {
	'use strict';

	const targetModel = exports.getTargetModel( options.model );
	// store map in a variable as a performance improvement to prevent an object chain lookup for each iteration
	let map = options.map;

	targetModel.model.find()
		.exec()
		.then( function( models ) {

			for( let model of models ) {
				// uses the passed in map object to bind the id in the old system ( key ) to the id in the new system ( value )
				map[ model.oldId ] = model._id;
			}

			done();
		});
}
