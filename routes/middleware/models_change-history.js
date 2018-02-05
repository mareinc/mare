const keystone 	= require( 'keystone' ),
	  _			= require( 'underscore' ),
	  moment	= require( 'moment' ),
	  async		= require( 'async' );

exports.checkFieldForChanges = ( field, model, modelBefore, changeHistory, done ) => {

	let fieldBefore,
		fieldAfter,
		valuesBefore = [],
		values = [],
		valueBefore = '',
		value = '';

	if( field.grandparent ) {
		// Keystone converts from undefined to {} in some cases on second save, this fixes the comparison
		modelBefore[ field.grandparent ] = modelBefore[ field.grandparent ] ? modelBefore[ field.grandparent ] : {};
		model[ field.grandparent ] = model[ field.grandparent ] ? model[ field.grandparent ] : {};
		// if field.grandparent is set to an empty object, the check for field.parent will return undefined
		// if this is the case, we can't get the field data without throwing an error
		fieldBefore = modelBefore[ field.grandparent ][ field.parent ] ? modelBefore[ field.grandparent ][ field.parent ][ field.name ] : undefined;
		fieldAfter = model[ field.grandparent ][ field.parent ] ? model[ field.grandparent ][ field.parent ][ field.name ] : undefined;

	} else if( field.parent ) {
		// Keystone converts from undefined to {} in some cases on second save, this fixes the comparison
		modelBefore[ field.parent ] = modelBefore[ field.parent ] ? modelBefore[ field.parent ] : {};
		model[ field.parent ] = model[ field.parent ] ? model[ field.parent ] : {};

		fieldBefore = modelBefore[ field.parent ][ field.name ];
		fieldAfter = model[ field.parent ][ field.name ];

	} else {

		fieldBefore = modelBefore[ field.name ];
		fieldAfter = model[ field.name ];
	}

	if( field.type === 'string' && ( !!fieldBefore || !!fieldAfter ) && fieldBefore.toLowerCase() !== fieldAfter.toLowerCase() ) {

		valueBefore = fieldBefore ? fieldBefore : '';
		value = fieldAfter ? fieldAfter : '';

		exports.addToHistoryEntry( valueBefore, value, field.label, field.type, changeHistory );

		done();

	} else if( field.type === 'number' && fieldBefore !== fieldAfter && ( !!fieldBefore || !!fieldAfter ) ) {
		
		valueBefore = fieldBefore ? fieldBefore : '';
		value = fieldAfter ? fieldAfter : '';

		exports.addToHistoryEntry( valueBefore, value, field.label, field.type, changeHistory );

		done();

	} else if( field.type === 'boolean' && fieldBefore !== fieldAfter ) {
		
		valueBefore = fieldBefore ? fieldBefore : false;
		value = fieldAfter ? fieldAfter : false;

		exports.addToHistoryEntry( valueBefore, value, field.label, field.type, changeHistory );

		done();

	// Date.parse( null ) returns NaN, and NaN !== NaN, so the second check is needed
	} else if( field.type === 'date' && ( fieldBefore || fieldAfter ) ) {
		// convert the values to nicely formatted dates
		valueBefore = fieldBefore ? moment( fieldBefore ).format( 'MM/DD/YYYY' ) : '';
		value = fieldAfter ? moment( fieldAfter ).format( 'MM/DD/YYYY' ) : '';
		// not a part of the check above because Date.parse( fieldBefore ) !== Date.parse( fieldAfter ), even if they have the same date ( I think the milliseconds are appearing different )
		if( valueBefore !== value ) {
			exports.addToHistoryEntry( valueBefore, value, field.label, field.type, changeHistory );
		}

		done();
	// handle multi: true in Relationship fields
	} else if( field.type === 'relationship' && ( Array.isArray( fieldBefore ) || Array.isArray( fieldAfter ) ) ) {

		async.parallel([
			done => {

				keystone.list( field.model ).model
					.find()
					.where( '_id' ).in( fieldBefore )
					.exec(  )
					.then( models => {

						_.each( models, model => {
							if( field.targetParent ) {
								valuesBefore.push( model[ field.targetParent ][ field.targetField ] );
							} else {
								valuesBefore.push( model[ field.targetField ] );
							}
						});

						// execute done function if async is used to continue the flow of execution
						done();

					}, err => {

						console.log( err );
						done();
					});
			},
			done => {

				keystone.list( field.model ).model
					.find()
					.where( '_id' ).in( fieldAfter )
					.exec()
					.then( models => {

						_.each( models, model => {
							if( field.targetParent ) {
								values.push( model[ field.targetParent ][ field.targetField ] );
							} else {
								values.push( model[ field.targetField ] );
							}
						});

						// execute done function if async is used to continue the flow of execution
						done();

					}, err => {

						console.log( err );
						done();
					});
			}
		], () => {

			var valuesBeforeString = valuesBefore.sort().toString().replace( /,/g, ', ' ),
				valuesString = values.sort().toString().replace( /,/g, ', ' );

			if( valuesBeforeString !== valuesString ) {

				exports.addToHistoryEntry( valuesBeforeString, valuesString, field.label, field.type, changeHistory );
			}

			done();

		});

	} else if( field.type === 'relationship' && ( !Array.isArray( fieldBefore ) && !Array.isArray( fieldAfter ) ) ) {

		if( !fieldBefore && !fieldAfter ) {
			done();
		} else {
			async.parallel([
				done => {
					if( !fieldBefore ) {
						done();
					} else {
						keystone.list( field.model ).model
							.findById( fieldBefore )
							.exec()
							.then( model => {

								if( field.targetParent ) {
									valueBefore = model[ field.targetParent ][ field.targetField ];
								} else {
									valueBefore = model[ field.targetField ];
								}

								done();
							}, err => {

								console.log( err );
								done();
							});
					}
				},
				done => {
					if( !fieldAfter ) {
						done();
					} else {
						keystone.list( field.model ).model
							.findById( fieldAfter )
							.exec()
							.then( model => {

								if( field.targetParent ) {
									value = model[ field.targetParent ][ field.targetField ];
								} else {
									value = model[ field.targetField ];
								}

								done();
							}, err => {

								console.log( err );
								done();
							});
					}
				}
			], () => {
				if( valueBefore !== value ) {

					exports.addToHistoryEntry( valueBefore, value, field.label, field.type, changeHistory );
				}

				done();

			});
		}
	} else {
		done();
	}
};

exports.addToHistoryEntry = ( valueBefore, value, label, fieldType, changeHistory ) => {

	if( changeHistory.summary !== '' ) {
		changeHistory.summary += ', ';
	}

	if( changeHistory.changes !== '' ) {
		changeHistory.changes += '\n\n';
	}

	if( valueBefore === false ) {
		valueBefore = 'false';
	}

	if( value === false ) {
		value = 'false';
	}
	// the wording around values changing to blank or false depends on the field type
	let emptyFieldText;
	// assign the appropriate text if the field was changed to blank or false based on the field type
	switch( fieldType ) {
		case 'string'		: emptyFieldText = 'was deleted'; break;
		case 'boolean'		: emptyFieldText = 'was changed to false'; break;
		case 'number'		: emptyFieldText = 'was deleted'; break;
		case 'date'			: emptyFieldText = 'was deleted'; break;
		case 'relationship'	: emptyFieldText = 'was deleted'; break;
		default				: emptyFieldText = 'was deleted';
	}

	// add the summary entry
	changeHistory.summary += label;

	// if the field wasn't removed or changed to false
	if( value || value === 0 ) {
		changeHistory.changes += `<p><strong>${ label }</strong> was changed to ${ value }</p>`;
	// if the field was removed or changed to false
	} else {
		changeHistory.changes += `<p><strong>${ label }</strong> ${ emptyFieldText }</p>`;
	}
};

/* if the model is created via the website, there is no updatedBy.  In these cases we need to populate it with the website bot's id */
exports.setUpdatedby = ( targetModel, done ) => {
	// if the user was created using the website	
	if( !targetModel.updatedBy ) {

		keystone.list( 'Admin' ).model
			.findOne()
			.where( 'name.full' ).equals( 'Website Bot' )
			.select( '_id name' )
			.lean()
			.exec()
			.then( websiteBot => {
				// set the updatedBy field to the id of the website bot
				targetModel.updatedBy = websiteBot._id;

				done();
			}, err => {

				console.log( err );

				done();
			});
	// otherwise, if the user was created using the admin UI
	} else {
		// TODO: move this check to the top to match other functions and make more readable
		// move on as the updatedBy field is already set
		done();
	}
};
