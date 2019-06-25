const flashMessages	= require( '../../utils/notification.middleware' );

exports.PHYSICAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.INTELLECTUAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.EMOTIONAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];
exports.SOCIAL_NEEDS_OPTIONS = [ 'none', 'mild', 'moderate', 'severe' ];

exports.getPhysicalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( exports.PHYSICAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getIntellectualNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( exports.INTELLECTUAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getEmotionalNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( exports.EMOTIONAL_NEEDS_OPTIONS, fromNeed, toNeed );
};

exports.getSocialNeedsRange = ( fromNeed, toNeed ) => {
	return getRangeFromArrayOfNoneEmptyStrings( exports.SOCIAL_NEEDS_OPTIONS, fromNeed, toNeed );
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

exports.extractSocialWorkersData = ( socialWorkers ) => {
	return socialWorkers.map( ( socialWorker ) => {
		return {
			id: socialWorker._id,
			name: socialWorker.name
		}
	});
}

exports.extractAgenicesData = ( agencies ) => {
	return agencies.map( ( agency ) => {
		return {
			id: agency._id,
			name: agency.name
		}
	});
}

exports.unescapeHTML = (str) => {
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