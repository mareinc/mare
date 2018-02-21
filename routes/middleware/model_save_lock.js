
let lockedModels = new Set();

exports.lock = modelID => {

	console.log( `locking ${ modelID }` );
	lockedModels.add( modelID );
};

exports.unlock = modelID => {

	console.log( `unlocking ${ modelID }` );
	lockedModels.delete( modelID );
};

exports.isLocked = modelID => {

	return lockedModels.has( modelID );
};

