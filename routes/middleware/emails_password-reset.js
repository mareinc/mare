const keystone				= require( 'keystone' );
const utilitiesMiddleware   = require( './utilities' );


/**
 * 
 * @param {string} fullName   - user full name
 * @param {string} email      - user email
 * @param {string} host       - web host
 * @param {string} resetToken - password reset token
 */
exports.sendPasswordResetEmail = ( fullName ,email, host, resetToken) => {

    return new Promise( (resolve,reject) =>{

        // find the email template in templates/emails/
		new keystone.Email({
            
                        templateExt 	: 'hbs',
                        templateEngine 	: require( 'handlebars' ),
                        templateName 	: 'login_reset-password'
            
                    }).send({
            
                        to: email,
                        from: {
                            name 	: 'MARE',
                            email 	: 'admin@adoptions.io' //@Jared this should probably be in a constant file or something?
                        },
                        subject       		: 'Password Reset',
                        fullName,
                        host,
                        resetToken
            
                    }, ( err, message ) => {
                        // log any errors
                        if( err ) {
                            return reject( `error sending password reset email: ${ err }` );
                        }
                        // the response object is stored as the 0th element of the returned message
                        const response = message ? message[ 0 ] : undefined;
                        // if the email failed to send, or an error occurred ( which it does, rarely ) causing the response message to be empty
                        if( response && [ 'rejected', 'invalid', undefined ].includes( response.status ) ) {
                            // reject the promise with details
                            return reject( `password reset email failed to send: ${ message }.  Error: ${ err }` );
                        }
            
                        resolve();
                    });
    });
}