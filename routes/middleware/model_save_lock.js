// a utility to lock Models while they are being saved to prevent multiple saves from occuring simultaneously

// creates a private Set to store all locked models
let _lockedModels = new Set();

// locks a model
exports.lock = modelId => {

	_lockedModels.add( modelId );
};

//  unlocks a model
exports.unlock = modelId => {

	_lockedModels.delete( modelId );
};

// returns the status of a model
exports.isLocked = modelId => {

	return _lockedModels.has( modelId );
};

