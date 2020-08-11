const keystone = require( 'keystone' );
const async = require( 'async' );
const userMiddleware = require( '../users/user.controllers' );
const flashMessageMiddleware = require( '../../utils/notification.middleware' );

/* prevents people from accessing protected pages when they're not signed in */
exports.requireUser = function( userType ) {
	
	return function( req, res, next ) {
		'use strict';

		if( !req.user || ( userType && req.user.userType !== userType ) ) {

			req.flash( 'error', {
				title: `You don't have access to that page`,
				detail: req.user && req.user.userType === 'admin'
					? 'Please log in as the correct user type to continue'
					: 'Please log in to continue'
			});

			return res.redirect( 303, '/' );
		}
		
		next();
	}
};

exports.login = function( req, res, next ) {

	let locals = res.locals;

	if ( !req.body.email || !req.body.password ) {
		
		// log the error for debugging purposes
		console.error( 'ERROR CODE:LOGIN01 - Login failure: missing username or password' );

		/* TODO: need a better message for the user, flash messages won't work because page reloads are stupid */
		req.flash( 'error', { title: 'Something went wrong',
							  detail: 'Please enter your username and password' } );
		
		res.redirect( req.body.target || '/' );

		return;
	}

	async.series([
		done => { userMiddleware.checkUserActiveStatus( req.body.email, locals, done ); }
	], () =>{

		if( locals.userStatus === 'nonexistent' ) {

			// log the error for debugging purposes
			console.error( 'ERROR CODE:LOGIN02 - Login failure: non-existent username (email).' );

			req.flash( 'error', { title: 'Something went wrong',
							  	  detail: 'Your username or password is incorrect, please try again' } );
			
			res.redirect( req.body.target || '/' );

		} else if( locals.userStatus === 'inactive' ) {

			// log the error for debugging purposes
			console.error( 'ERROR CODE:LOGIN03 - Login failure: account inactive.' );

			// TODO: we need to figure out if they were once active, or change the message to handle that case as well
			req.flash( 'error', {
				detail: 'The email you are trying to use already exists in the system.  Please reset your password for this email address in order to gain access.    If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
			});

			res.redirect( req.body.target || '/' );

		} else if( locals.userStatus === 'active' ) {
			// TODO: you can add a target to the signin of the current page and it will always route correctly back to where the user was
			var onSuccess = function() {
				if ( req.body.target && !/join|signin/.test( req.body.target ) ) { // TODO: I don't think this is needed anymore
					res.redirect( req.body.target || '/' );
				} else {
					res.redirect( '/' );
				}
			}

			var onFail = function( error ) {

				// log the error for debugging purposes
				console.error( 'ERROR CODE:LOGIN00 - Login failure: unknown error.' );
				console.error( error );

				/* TODO: need a better message for the user, flash messages won't work because page reloads are stupid */
				req.flash( 'error', { title: 'Something went wrong',
									  detail: 'Please try again.  If this error persists, please notify <a href="mailto:communications@mareinc.org">communications@mareinc.org</a>' } );
				req.body.target ? res.redirect( req.body.target ) : res.redirect( '/' );
			}

			keystone.session.signin( { email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail );
		}
	})
};

exports.loginAjax = function loginAjax( req, res, next ) {

	let locals = res.locals;

	if ( !req.body.email || !req.body.password ) {

		flashMessageMiddleware.appendFlashMessage({
			messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
			title: 'Something went wrong',
			message: 'Please enter your username and password.'
		});

		generateAndSendFailureMessage();

	} else {

		async.series([
			done => { userMiddleware.checkUserActiveStatus( req.body.email, locals, done ); }
		], () => {
	
			if ( locals.userStatus === 'nonexistent' ) {
	
				flashMessageMiddleware.appendFlashMessage({
					messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
					title: 'Something went wrong',
					message: 'Your username or password is incorrect, please try again.'
				});

				generateAndSendFailureMessage();
	
			} else if ( locals.userStatus === 'inactive' ) {
				
				// TODO: we need to figure out if they were once active, or change the message to handle that case as well
				flashMessageMiddleware.appendFlashMessage({
					messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
					message: 'The email you are trying to use already exists in the system.  Please reset your password for this email address in order to gain access.    If this error persists, please notify MARE at <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
				});

				generateAndSendFailureMessage();
	
			} else if ( locals.userStatus === 'active' ) {
				
				// TODO: you can add a target to the signin of the current page and it will always route correctly back to where the user was
				var onSuccess = function() {
					
					// send a success message along with the post-login destination page
					res.send({ 
						status: 'success',
						targetPage: req.body.target || '/' 
					});
				}
	
				var onFail = function() {
					
					flashMessageMiddleware.appendFlashMessage({
						messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
						title: 'Your username or password is incorrect, please try again.',
						message: ''
					});

					generateAndSendFailureMessage();
				}
	
				keystone.session.signin( { email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail );
			}
		});
	}

	// helper to generate and send login failure flash messages
	function generateAndSendFailureMessage() {

		flashMessageMiddleware.generateFlashMessageMarkup()
			.then( flashMessageMarkup => {

				res.send({
					status: 'error',
					flashMessage: flashMessageMarkup 
				});
			})
			.catch( err => {

				next( err );
			});
	}
};

exports.logout = function(req, res) {

	keystone.session.signout( req, res, function() {
		req.query.target ? res.redirect( req.query.target ) : res.redirect( '/' );
	});
};