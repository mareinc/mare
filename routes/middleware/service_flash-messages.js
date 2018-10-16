/* a service to generate flash message markup to support messaging for AJAX requests */

const fs			= require( 'fs' ),
      handlebars    = require( 'handlebars' ),	
      helpers       = require( '../../templates/views/helpers/index' )();

// private placeholder for the list of flash messages to display
let _messages = {};

exports = module.exports = {

    // append a flash message to the messages list
    appendFlashMessage: function appendFlashMessage( { messageType, title, message } ) {

        // check to ensure a message list for the current message type exists
        if ( !_messages[ messageType ] ) {
            _messages[ messageType ] = [];
        }
        
        // add the message to the message list
        _messages[ messageType ].push({
            title,
            detail: message
        });
    },
    
    // generates messaging markup based on the current list of flash messages
    generateFlashMessageMarkup: function generateFlashMessageMarkup() {
        
        // get the relative path to the flash-messages hbs template partial
        var templatePath = `${ __dirname }/../../templates/views/partials/flash-messages.hbs`;

        return new Promise( ( resolve, reject ) => {

            // read the hbs template
            fs.readFile( templatePath, ( error, data ) => {

                // generate the markup for the flash messages
                if ( !error ) {

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
                    reject( error );
                }

                // clear the message list
                _messages = {};
            });
        });
    },

    // define the various response message types
    MESSAGE_TYPES: {
        ERROR: 'error',
        SUCCESS: 'success',
        INFO: 'info',
        WARNING: 'warning'
    }
};
