const fs = require( 'fs' );
const _ = require( 'underscore' );
const handlebars = require( 'handlebars' );	
const helpers = require( '../templates/views/helpers/index' )();

// private placeholder for the list of flash messages to display
// TODO IMPORTANT: this should be created per request on the req or res objects
let _messages = {};

// define the various response message types
exports.MESSAGE_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning'
};

// append a flash message to the messages list
exports.appendFlashMessage = ( { messageType, title, message } ) => {
    // check to ensure a message list for the current message type exists
    if ( !_messages[ messageType ] ) {
        _messages[ messageType ] = [];
    }
    
    // add the message to the message list
    _messages[ messageType ].push({
        title,
        detail: message
    });
};
    
// generates messaging markup based on the current list of flash messages
exports.generateFlashMessageMarkup = () => {
    
    // get the relative path to the flash-messages hbs template partial
    var templatePath = `${ __dirname }/../templates/views/partials/flash-messages.hbs`;

    return new Promise( ( resolve, reject ) => {

        // read the hbs template
        fs.readFile( templatePath, ( err, data ) => {

            // TODO: flip this check so we return if there's an error and proceed normally if not
            // generate the markup for the flash messages
            if ( !err ) {

                // get the contents of the file as a string
                const templateString = data.toString();
                // compile the template string
                const template = handlebars.compile( templateString );
                // register the flashMessages helper
                handlebars.registerHelper( 'flashMessages', helpers.flashMessages );

                // interpolate the template with flash message data
                const html = template( { messages: _messages } );

                resolve( html );

            // reject with error
            } else {
                reject( err );
            }

            // clear the message list
            _messages = {};
        });
    });
};

/* fetches and clears the flashMessages before a view is rendered */
exports.flashMessages = function(req, res, next) {
	'use strict';

	var flashMessages = {
		info: req.flash( 'info' ),
		success: req.flash( 'success' ),
		warning: req.flash( 'warning' ),
		error: req.flash( 'error' )
	};

	res.locals.messages = _.any( flashMessages, function( msgs ) { return msgs.length; }) ? flashMessages : false;

	next();
};

exports.sendSuccessFlashMessage = ( res, title, message ) => {
	// create a flash message to send back to the user
	exports.appendFlashMessage({
		messageType: exports.MESSAGE_TYPES.SUCCESS,
		title: title,
		message: message,
	});
	
	// send the status and flash message markup
	exports.generateFlashMessageMarkup()
		.then( flashMessageMarkup => {
			res.send({
				status: 'success',
				flashMessage: flashMessageMarkup
			});
		});
}

exports.sendErrorFlashMessage = ( res, title, message ) => {
	// create a flash message to send back to the user
	exports.appendFlashMessage({
		messageType: exports.MESSAGE_TYPES.ERROR,
		title: title,
		message: message,
	});
	
	// send the status and flash message markup
	exports.generateFlashMessageMarkup()
		.then( flashMessageMarkup => {
			res.send({
				status: 'error',
				flashMessage: flashMessageMarkup
			});
		});
}