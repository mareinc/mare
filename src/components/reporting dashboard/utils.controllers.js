const flashMessages	= require( '../../utils/notification.middleware' );

const 	PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ],
		INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ],
		EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ],
		SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];

exports.getPhysicalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( PHYSICAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getIntellectualNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( INTELLECTUAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getEmotionalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( EMOTIONAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getSocialNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( SOCIAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.sendSuccessFlashMessage = ( res, title, message ) => {
	// create a flash message to send back to the user
	flashMessages.appendFlashMessage({
		messageType: flashMessages.MESSAGE_TYPES.SUCCESS,
		title: title,
		message: message,
	});
	
	// send the status and flash message markup
	flashMessages.generateFlashMessageMarkup()
		.then( flashMessageMarkup => {
			res.send({
				status: 'success',
				flashMessage: flashMessageMarkup
			});
		});
}

exports.sendErrorFlashMessage = ( res, title, message ) => {
	// create a flash message to send back to the user
	flashMessages.appendFlashMessage({
		messageType: flashMessages.MESSAGE_TYPES.ERROR,
		title: title,
		message: message,
	});
	
	// send the status and flash message markup
	flashMessages.generateFlashMessageMarkup()
		.then( flashMessageMarkup => {
			res.send({
				status: 'error',
				flashMessage: flashMessageMarkup
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