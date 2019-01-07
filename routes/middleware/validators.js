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