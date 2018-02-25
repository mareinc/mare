// a utility to lock Models while they are being saved to prevent multiple saves from occuring simultaneously

// creates a private Set to store all locked models
let _lockedModels = new Set();

// locks a model
exports.lock = modelID => {

	_lockedModels.add( modelID );
};

//  unlocks a model
exports.unlock = modelID => {

	_lockedModels.delete( modelID );
};

// returns the status of a model
exports.isLocked = modelID => {

	return _lockedModels.has( modelID );
};

