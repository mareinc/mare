/* a place for validation functions and objects */

exports.phoneValidator = {
	validator: function( text ) {
		if ( ( typeof text === 'string' || text instanceof String ) && text.length > 0 ) {
			return /^\d{3}-\d{3}-\d{4}$/.test( text );
		} else {
			return true;
		}
	},
	message: "Please use xxx-xxx-xxxx format."
};

exports.zipValidator = {
	validator: function( text ) {
		if ( ( typeof text === 'string' || text instanceof String ) && text.length > 0 ) {
			return /^[0-9]{5}(?:-[0-9]{4})?$/.test( text );
		} else {
			return true;
		}
	},
	message: "Please use xxxxx or xxxxx-xxxx format."
};

exports.timeValidator = {
	validator: function( text ) {
		if ( ( typeof text === 'string' || text instanceof String ) && text.length > 0 ) {
			return /^((1[0-2]|0?[1-9]):([0-5][0-9])([AaPp][Mm]))$/.test( text );
		} else {
			return true;
		}
	},
	message: "Please use HH:MMam or HH:MMpm format."
};