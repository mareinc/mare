const keystone = require( 'keystone' );
const async = require( 'async' );
const userMiddleware = require( '../users/user.controllers' );
const flashMessageMiddleware = require( '../../utils/notification.middleware' );
const errorUtils = require('../../utils/errors.controllers');
const EXPORT_TOKEN = process.env.EXPORT_TOKEN;
const EXPORT_BOT_USERNAME = process.env.EXPORT_BOT_USERNAME;
const EXPORT_BOT_PASSWORD = process.env.EXPORT_BOT_PASSWORD;

/* prevents people from accessing protected pages when they're not signed in */
exports.requireUser = function( userType ) {
	
	return function( req, res, next ) {
		'use strict';

		if( !req.user || ( userType && req.user.userType !== userType ) ) {

			// req.flash( 'error', {
			// 	title: `You don't have access to that page`,
			// 	detail: req.user && req.user.userType === 'admin'
			// 		? 'Please log in as the correct user type to continue'
			// 		: 'Please log in to continue'
			// });

			// if there is no specific user type required, maintain redirect path so the user is returned to the
			// page they were trying to access on successful login
			return !userType ? res.redirect( 303, `/?showLogin=true&redirectPath=${req.path}` ) : res.redirect( 303, '/' );
		}
		
		next();
	}
};

// validate request for CSV exports for reporting
// NOTE: Zapier makes multiple requests simultaneously for every scheduled task, which crashes the application (JS runs out of memory) for some exports.
// To mitigate this we debounce incoming requests for the specified duration, and only respond to the most recent request made.
const QUEUE_DRATION = 5000;
const requestQueue = [];
exports.validateExportRequest = function( req, res, next ) {

	// log activity
	const requestPath = req.path;
	console.log( `Export Request Receieved for path: ${requestPath}` );

	// ensure request came from Zapier
	const isZapier = !!req.headers['user-agent'].match(/Zapier/);

	// get the token from query params
	const REQUEST_TOKEN = req.query.token;

	// if the token matches, allow CSV export
	if ( isZapier && EXPORT_TOKEN === REQUEST_TOKEN ) {

		// add request to queue
		requestQueue.push( requestPath );

		// debounce this export request while waiting for further requests
		setTimeout(() => {

			// remove request from queue
			requestQueue.splice( requestQueue.indexOf( requestPath ), 1 );

			// if this is the last request in the queue...
			if ( !requestQueue.includes( requestPath ) ) {

				// authenticate and pass to next
				keystone.session.signin( { email: EXPORT_BOT_USERNAME, password: EXPORT_BOT_PASSWORD }, req, res, () => next(), () => res.send( 'Authentication Failed' ) );

			// if this is not the last request in the queue...
			} else {

				// send a success response, but do not process export
				res.send( 'Request Debounced' );
			}
		}, QUEUE_DRATION);

	// otherwise, send an empty response
	} else {
		res.send();
	}
};

exports.login = function( req, res, next ) {

	let locals = res.locals;

	if ( !req.body.email || !req.body.password ) {

		// get standardized error data
		const errorData = errorUtils.ERRORS.LOGIN.NO_USER_OR_PASS;
		// log the error for debugging purposes
		errorUtils.logCodedError( errorData.code, errorData.message );
		// display a message to the user
		req.flash( 'error', errorData.flashMessage );
		
		res.redirect( req.body.target || '/' );

		return;
	}

	async.series([
		done => { userMiddleware.checkUserActiveStatus( req.body.email, locals, done ); }
	], () =>{

		if( locals.userStatus === 'nonexistent' ) {

			// test to see if this is a MA social worker who might have multiple email domains
			const MA_STATE_EMAIL_REGEX = /@mass\.gov|@state\.ma\.us|@massmail\.state\.ma\.us/i;
			const isMAStateEmail = MA_STATE_EMAIL_REGEX.test( req.body.email );

			if ( isMAStateEmail ) {

				// get email username
				const emailName = req.body.email.split( '@' )[0];

				// generate potential alternate email adresses with different MA state domains
				const potentialAlternateEmails = [
					`${emailName}@mass.gov`,
					`${emailName}@state.ma.us`,
					`${emailName}@massmail.state.ma.us`
				];
				
				let errorData;
				// search for potential alternate email adresses with the same name but different domain
				keystone.list( 'Social Worker' ).model
					.findOne( { email: { $in: potentialAlternateEmails } } )
					.lean()
					.exec()
					.then( userDoc => {

						if ( userDoc ) {
							// get standardized error data
							errorData = errorUtils.ERRORS.LOGIN.ALTERNATIVE_EMAIL_DOMAIN;
							// log the error for debugging purposes
							errorUtils.logCodedError(
								errorData.code,
								errorData.message,
								`Attempted login with email: ${req.body.email}, found potential alternate account: ${userDoc.email}`
							);
							// add dynamic detail to flash message
							errorData.flashMessage.detail = `There is no account associated with the email address you entered: ${req.body.email}.` + 
							`<br><br>There is an account on record with a different email domain: <strong>${userDoc.email}</strong>. If you have used the MARE website before, please try logging in with that email address.` +  
							`<br><br>If this your first time using the MARE website, please create a new account <a href="/register">here</a>.`;
						}
					})
					.catch( error => console.error( error ) )
					.finally( () => {

						if ( !errorData ) {
							// get standardized error data
							errorData = errorUtils.ERRORS.LOGIN.NO_MATCHING_EMAIL;
							// log the error for debugging purposes
							errorUtils.logCodedError(
								errorData.code,
								errorData.message,
								`Attempted login with email: ${req.body.email}`
							);
						}
						
						// display a message to the user
						req.flash( 'error', errorData.flashMessage );
						res.redirect( req.body.target || '/' );
					});
			} else {

				// get standardized error data
				const errorData = errorUtils.ERRORS.LOGIN.NO_MATCHING_EMAIL;
				// log the error for debugging purposes
				errorUtils.logCodedError(
					errorData.code,
					errorData.message,
					`Attempted login with email: ${req.body.email}`
				);
				// display a message to the user
				req.flash( 'error', errorData.flashMessage );
				
				res.redirect( req.body.target || '/' );
			}

		} else if( locals.userStatus === 'inactive' ) {

			// get standardized error data
			const errorData = errorUtils.ERRORS.LOGIN.ACCOUNT_INACTIVE;
			// log the error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted login with email: ${req.body.email}`
			);
			// display a message to the user
			req.flash( 'error', errorData.flashMessage );

			res.redirect( req.body.target || '/' );

		} else if( locals.userStatus === 'unverified' ) {

			// get standardized error data
			const errorData = errorUtils.ERRORS.LOGIN.ACCOUNT_UNVERIFIED;
			// log the error for debugging purposes
			errorUtils.logCodedError(
				errorData.code,
				errorData.message,
				`Attempted login with email: ${req.body.email}`
			);
			// display a message to the user
			req.flash( 'error', errorData.flashMessage );

			res.redirect( req.body.target || '/' );

		} else if( locals.userStatus === 'active' ) {
			// TODO: you can add a target to the signin of the current page and it will always route correctly back to where the user was
			var onSuccess = function() {
				
				// log the success for debugging purposes
				errorUtils.logCodedError(
					errorUtils.ERRORS.LOGIN.SUCCESS.code,
					errorUtils.ERRORS.LOGIN.SUCCESS.message,
					`Successful login with email: ${req.body.email}`,
					true
				);

				if ( req.body.target && !/join|signin/.test( req.body.target ) ) { // TODO: I don't think this is needed anymore
					res.redirect( req.body.target || '/' );
				} else {
					res.redirect( '/' );
				}
			}

			var onFail = function( error ) {

				// if failure occured because of an incorrect password
				if ( error.message === 'Incorrect email or password' ) {

					// get standardized error data
					const errorData = errorUtils.ERRORS.LOGIN.INCORRECT_PASSWORD;
					// log the error for debugging purposes
					errorUtils.logCodedError(
						errorData.code,
						errorData.message,
						`Attempted login with email: ${req.body.email}`
					);
					// display a message to the user
					req.flash( 'error', errorData.flashMessage );

				// if the failure occured for an unexpected reason
				} else {
					// get standardized error data
					const errorData = errorUtils.ERRORS.LOGIN.UNEXPECTED_ERROR;
					// log the coded error for debugging purposes
					errorUtils.logCodedError(
						errorData.code,
						errorData.message,
						`Attempted login with email: ${req.body.email}`
					);
					// log the thrown error
					console.error( error );
					// display a message to the user
					req.flash( 'error', errorData.flashMessage );
				}

				req.body.target ? res.redirect( req.body.target ) : res.redirect( '/' );
			}

			keystone.session.signin( { email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail );
		}
	})
};

exports.loginAjax = function loginAjax( req, res, next ) {

	let locals = res.locals;

	if ( !req.body.email || !req.body.password ) {

		// get standardized error data
		const errorData = errorUtils.ERRORS.LOGIN.NO_USER_OR_PASS;
		// log the error for debugging purposes
		errorUtils.logCodedError( errorData.code, errorData.message );
		// display a message to the user
		flashMessageMiddleware.appendFlashMessage({
			messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
			title: errorData.flashMessage.title,
			message: errorData.flashMessage.detail
		});

		generateAndSendFailureMessage();

	} else {

		async.series([
			done => { userMiddleware.checkUserActiveStatus( req.body.email, locals, done ); }
		], () => {
	
			if ( locals.userStatus === 'nonexistent' ) {

				// get standardized error data
				const errorData = errorUtils.ERRORS.LOGIN.NO_MATCHING_EMAIL;
				// log the error for debugging purposes
				errorUtils.logCodedError(
					errorData.code,
					errorData.message,
					`Attempted login with email: ${req.body.email}`
				);
				// display a message to the user
				flashMessageMiddleware.appendFlashMessage({
					messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
					title: errorData.flashMessage.title,
					message: errorData.flashMessage.detail
				});

				generateAndSendFailureMessage();
	
			} else if ( locals.userStatus === 'inactive' ) {

				// get standardized error data
				const errorData = errorUtils.ERRORS.LOGIN.ACCOUNT_INACTIVE;
				// log the error for debugging purposes
				errorUtils.logCodedError(
					errorData.code,
					errorData.message,
					`Attempted login with email: ${req.body.email}`
				);
				// display a message to the user
				flashMessageMiddleware.appendFlashMessage({
					messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
					title: errorData.flashMessage.title,
					message: errorData.flashMessage.detail
				});

				generateAndSendFailureMessage();
	
			} else if ( locals.userStatus === 'active' ) {
				
				// TODO: you can add a target to the signin of the current page and it will always route correctly back to where the user was
				var onSuccess = function() {

					// log the success for debugging purposes
					errorUtils.logCodedError(
						errorUtils.ERRORS.LOGIN.SUCCESS.code,
						errorUtils.ERRORS.LOGIN.SUCCESS.message,
						`Successful login with email: ${req.body.email}`,
						true
					);
					
					// send a success message along with the post-login destination page
					res.send({ 
						status: 'success',
						targetPage: req.body.target || '/' 
					});
				}
	
				var onFail = function( error ) {

					// if failure occured because of an incorrect password
					if ( error.message === 'Incorrect email or password' ) {

						// get standardized error data
						const errorData = errorUtils.ERRORS.LOGIN.INCORRECT_PASSWORD;
						// log the error for debugging purposes
						errorUtils.logCodedError(
							errorData.code,
							errorData.message,
							`Attempted login with email: ${req.body.email}`
						);
						// display a message to the user
						flashMessageMiddleware.appendFlashMessage({
							messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
							title: errorData.flashMessage.title,
							message: errorData.flashMessage.detail
						});

					// if the failure occured for an unexpected reason
					} else {

						
						// get standardized error data
						const errorData = errorUtils.ERRORS.LOGIN.UNEXPECTED_ERROR;
						// log the coded error for debugging purposes
						errorUtils.logCodedError(
							errorData.code,
							errorData.message,
							`Attempted login with email: ${req.body.email}`
						);
						// log the thrown error
						console.error( error );
						// display a message to the user
						flashMessageMiddleware.appendFlashMessage({
							messageType: flashMessageMiddleware.MESSAGE_TYPES.ERROR,
							title: errorData.flashMessage.title,
							message: errorData.flashMessage.detail
						});
					}

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
