const keystone 			= require( 'keystone' ),
	  listService		= require( '../lists/list.controllers' ),
	  childService		= require( '../children/child.controllers' ),
	  familyService		= require( '../families/family.controllers' ),
	  ObjectId 			= require('mongodb').ObjectId;
	  
function getObjects( modelName, mapFunction ) {
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( modelName ).model
			.find()
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
}

function getRangeFromArrayOfNoneEmptyStrings( array, fromElement, toElement ) {
	let include = typeof fromElement === 'undefined' || fromElement.length === 0;
	let forceDontInclude = false;
	let results = [];
	
	array.forEach( ( item ) => {
		if ( item === fromElement && ! forceDontInclude ) {
			include = true;
		}
		if ( include ) {
			results.push( item );
		}
		if ( item === toElement ) {
			include = false;
			forceDontInclude = true;
		}
	});
	
	return results;
}

exports.getChildStatusesOptions = ( currentValues, selectDefault ) => {
	
	return getObjects( 'Child Status', ( value ) => {
		
			let selected = false;
			if ( selectDefault === true ) {
				selected = value.childStatus == 'active';
			} else {
				selected = Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false;
			}
		
			return {
				id: value._id.toString(),
				name: value.childStatus,
				selected: selected
			}
		}
	);
	
};

exports.getGendersOptions = ( currentValues ) => {
	
	return getObjects( 'Gender', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.gender,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getRacesOptions = ( currentValues ) => {
	return getObjects( 'Race', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.race,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getLegalStatusesOptions = ( currentValues ) => {
	
	return getObjects( 'Legal Status', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.legalStatus,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getFamilyConstellationsOptions = ( currentValues ) => {
	
	return getObjects( 'Family Constellation', ( value ) => {
			return {
				id: value._id.toString(),
				name: value.familyConstellation,
				selected: Array.isArray( currentValues ) ? currentValues.includes( value._id.toString() ) : false
			}
		}
	);
	
};

exports.getAgesOptions = ( currentValue ) => {
	const MAX_AGE = 21;
	let results = [];
	let currentValueParsed = parseInt( currentValue );
	
	for ( let i = 0; i < MAX_AGE; i++  ) {
		results.push( {
			id: i,
			name: i,
			selected: i === currentValueParsed
		});
	}
	
	return results;
};

exports.getSiblingGroupSizesOptions = ( currentValue ) => {
	const MAX_SIZE = 10;
	let results = [];
	let currentValueParsed = parseInt( currentValue );
	
	for ( let i = 1; i < MAX_SIZE; i++  ) {
		results.push( {
			id: i,
			name: i,
			selected: i === currentValueParsed
		});
	}
	
	return results;
};

const PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getPhysicalNeedsOptions = ( currentValue ) => {
	return PHYSICAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};

exports.getPhysicalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( PHYSICAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getIntellectualNeedsOptions = ( currentValue ) => {
	return INTELLECTUAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};
exports.getIntellectualNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( INTELLECTUAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getEmotionalNeedsOptions = ( currentValue ) => {
	return EMOTIONAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
	
};
exports.getEmotionalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( EMOTIONAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

const SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.getSocialNeedsOptions = ( currentValue ) => {
	return SOCIAL_NEEDS_OPTIONS.map( ( value ) => {
		return {
			id: value,
			name: value,
			selected: value === currentValue
		}
	});
};
exports.getSocialNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( SOCIAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getAgenciesOptions = ( currentValues ) => {
	
	let mapFunction = ( value ) => {
		return {
			id: value._id,
			name: value.name
		}
	};
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Agency' ).model
			.find( {
				'_id': { $in: Array.isArray(currentValues) ? currentValues : [] }
			})
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
};

exports.getSocialWorkersOptions = ( currentValues ) => {
	
	let mapFunction = ( value ) => {
		return {
			id: value._id.toString(),
			name: value.name.full
		}
	};
	
	return new Promise( ( resolve, reject ) => {
		keystone.list( 'Social Worker' ).model
			.find( {
				'_id': { $in: Array.isArray(currentValues) ? currentValues : [] }
			})
			.exec()
			.then( results => {
				resolve( results.map( mapFunction ) );
			}, err => {
				reject( err );
			});
	});
	
};

exports.getAgenciesData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Agency' ).model
		.find( { 'name' : new RegExp( query, 'i' ) } )
		.sort( { 'name' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( agency ) => {
					return {
						id: agency._id.toString(),
						text: agency.name
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getSocialWorkersData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Social Worker' ).model
		.find( { 'name.full' : new RegExp( query, 'i' ) } )
		.sort( { 'name.full' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( socialWorker ) => {
					return {
						id: socialWorker._id.toString(),
						text: socialWorker.name.full
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getFamiliesData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Family' ).model
		.find( { 'displayNameAndRegistration' : new RegExp( query, 'i' ) } )
		.sort( { 'displayNameAndRegistration' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( family ) => {
					return {
						id: family._id.toString(),
						text: family.displayNameAndRegistration
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.getChildrenData = ( req, res, next ) => {
	const MAX_RESULTS = 10;
	let query = req.query.q;
	
	keystone.list( 'Child' ).model
		.find( { 'displayNameAndRegistration' : new RegExp( query, 'i' ) } )
		.sort( { 'displayNameAndRegistration' : 'asc' } )
		.limit( MAX_RESULTS )
		.exec()
		.then( results => {
			res.send( { 
				results: results.map( ( child ) => {
					return {
						id: child._id.toString(),
						text: child.displayNameAndRegistration
					}
				}),
				pagination: { more: false } 
			});
		}, err => {
			res.send( { results: [], pagination: { more: false } } );
		});
	
};

exports.saveChildrenMatchingHistory = ( req, res, next ) => {
	
	const familyID = req.body.familyID;
	
	
	childService.getChildrenByIds( req.body.ids ).then( children => {
		let tasks = [];
		
		children.forEach( child => {
			
			const ChildMatchingHistory = keystone.list( 'Child Matching History' );
			const childMatchingHistory = new ChildMatchingHistory.model({
				family: ObjectId( familyID ),
				child: child,
				createdBy: req.user,
				homestudySent: false,
				registrationNumber: child.registrationNumber
			});
			
			tasks.push( childMatchingHistory.save() );
		});
		
		Promise.all(tasks)
			.then( (results) => {
				res.send( { status: 'OK' } );
			})
			.catch( err => {
				console.error( `error saving child matching histories - ${ err }` );
				
				res.send( { status: 'ERROR', message: 'Error saving history entries' } );
			});
		
		
	})
	.catch( err => {
		console.error( `error loading children - ${ err }` );
		
		res.send( { status: 'ERROR', message: 'Error loading children' } );
	});
	
};

exports.saveFamiliesMatchingHistory = ( req, res, next ) => {
	
	const childID = req.body.childID;
	
	childService.getChildById( { id: childID } ).then( child => {
		familyService.getFamiliesByIds( req.body.ids ).then( families => {
			let tasks = [];
			let allChildrenIDs = [ childID ];
			
			// append all siblings:
			if ( Array.isArray( child.siblingsToBePlacedWith ) ) {
				child.siblingsToBePlacedWith.forEach( ( sibling ) => {
					allChildrenIDs.push( sibling.toString() );
				});
			}
			
			families.forEach( family => {
				allChildrenIDs.forEach( ( targetChildID ) => {
					const FamilyMatchingHistory = keystone.list( 'Family Matching History' );
					const familyMatchingHistory = new FamilyMatchingHistory.model({
						child: ObjectId( targetChildID ),
						family: family,
						createdBy: req.user,
						homestudySent: false,
						registrationNumber: family.registrationNumber
					});
					
					tasks.push( familyMatchingHistory.save() );
				});
			});
			
			Promise.all(tasks)
				.then( (results) => {
					res.send( { status: 'OK' } );
				})
				.catch( err => {
					console.error( `error saving family matching histories - ${ err }` );
					
					res.send( { status: 'ERROR', message: 'Error saving history entries' } );
				});
		})
		.catch( err => {
			console.error( `error loading families - ${ err }` );
			
			res.send( { status: 'ERROR', message: 'Error loading families' } );
		});
	})
	.catch( err => {
		console.error( `error saving family matching histories - could not load the child record- ${ err }` );
		
		res.send( { status: 'ERROR', message: 'Error loading the child record' } );
	});
};

exports.unescapeHTML= (str) => {
	const htmlEntities = {
		nbsp: ' ',
		cent: '¢',
		pound: '£',
		yen: '¥',
		euro: '€',
		copy: '©',
		reg: '®',
		lt: '<',
		gt: '>',
		quot: '"',
		amp: '&',
		apos: '\''
	};

	return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
		var match;

		if (entityCode in htmlEntities) {
			return htmlEntities[entityCode];
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
			return String.fromCharCode(parseInt(match[1], 16));
			/*eslint no-cond-assign: 0*/
		} else if (match = entityCode.match(/^#(\d+)$/)) {
			return String.fromCharCode(~~match[1]);
		} else {
			return entity;
		}
	});
};