const keystone = require( 'keystone' );

exports = module.exports = ( req, res ) => {
	'use strict';

    const view = new keystone.View( req, res );
    const locals = res.locals;

    // get the verification code
    locals.verificationCode = req.query.verificationCode;
    
    // try to find a matching verification code in the database
    keystone.list( 'Account Verification Code' ).model 
        .findOne( { code: locals.verificationCode } )
        .populate( 'user' )
        .exec()
        .then( verificationCodeDoc => {

            // if a matching verification code is found
            if ( verificationCodeDoc ) {

                locals.userType = verificationCodeDoc.user.userType;
                locals.userEmail = verificationCodeDoc.user.email;

            // if no code is found
            } else {
                locals.noCodeFound = true;
            }
        })
        .catch( error => console.error( error ) )
        .finally( () => view.render( 'form_account-verify' ) );
};
