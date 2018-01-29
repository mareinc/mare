const keystone				= require( 'keystone' );
const utilitiesMiddleware   = require( './utilities' );

exports.sendPasswordResetEmail = ( name, email, host, resetToken ) => {
    // TODO: there is no way to turn these emails off
    return new Promise( ( resolve,reject ) => {
        // find the email template in templates/emails/
		new keystone.Email({
            
            templateExt 	: 'hbs',
            templateEngine 	: require( 'handlebars' ),
            templateName 	: 'login_reset-password'

        }).send({

            to: email,
            from: {
                name 	: 'MARE',
                email 	: 'admin@adoptions.io' // TODO: this should be in a model or ENV variable
            },
            subject     : 'Password Reset',
            name,
            host,
            resetToken

        }, ( err, message ) => {

            if( err ) {
                // log the error for debugging purposes
                console.error( `error sending password reset email - ${ err }` );

                return reject();
            }
            // the response object is stored as the 0th element of the returned message
            const response = message ? message[ 0 ] : undefined;
            // if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
            if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
                // log the error for debugging purposes
                console.error( `error sending password reset email - ${ message } - ${ err }` );

                return reject();
            }

            resolve();
        });
    });
}