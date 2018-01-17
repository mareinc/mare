/* a service to generate flash message markup to support messaging for AJAX requests */

const   fs			= require( 'fs' ),
        handlebars	= require( 'handlebars' ),	
        helpers     = require( '../../templates/views/helpers/index' )();

exports = module.exports = {
    
    // generates a flash message to display the donation transaction status
    generateFlashMessage: function generateFlashMessage( messageType, title, message ) {
        
        // get the relative path to the flash-messages hbs template partial
        var templatePath = `${ __dirname }/../../templates/views/partials/flash-messages.hbs`;

        return new Promise( ( resolve, reject ) => {

            // read the hbs template
            fs.readFile( templatePath, ( error, data ) => {

                // generate the markup for the flash messages
                if ( !error ) {

                    // create the flash messages object
                    var messages = {};
                    
                    // add the message type
                    messages[ messageType ] = [{
                        title,
                        detail: message
                    }];

                    // get the contents of the file as a string
                    const templateString = data.toString();
                    // compile the template string
                    const template = handlebars.compile( templateString );
                    // register the flashMessages helper
                    handlebars.registerHelper( 'flashMessages', helpers.flashMessages );

                    // interpolate the template with flash message data
                    const html = template( { messages } );

                    resolve( html );

                // reject with error
                } else {
                    reject( error );
                }
            });
        });
    },

    // define the various response message types
    MESSAGE_TYPES: {
        ERROR: 'error',
	    SUCCESS: 'success'
    }
};
