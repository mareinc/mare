const keystone = require( 'keystone' );

exports.globalAlert = function globalAlert ( req, res, next ) {

    // set an empty inactive alert as the default behavior
    res.locals.globalAlert = { isActive: false };

    // check to see if an active alert exists
    keystone.list( 'Global Alert' ).model
			.findOne()
			.where( 'isActive' ).equals( true )
			.lean()
			.exec()
			.then( globalAlertDoc => {

                // if an active alert is found, overwrite the empty alert with the actual alert
                if ( globalAlertDoc ) {
                    res.locals.globalAlert = globalAlertDoc;
                }
                next();
            })
            .catch( err => {
                
                // if an error occurs, log the error but do not overwrite the default alert
                console.error( `There was an error retrieving global alert data - no alert can be displayed.` );
                console.error( err );
                next();
            });
};