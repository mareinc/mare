
// define error codes, logging, and messaging
const LOGIN_ERROR_FLASH_MESSAGE_TITLE = 'Something went wrong';
const REGISTRATION_ERROR_FLASH_MESSAGE_TITLE = 'There was a problem creating your account';

exports.ERRORS = {
    LOGIN: {
		NO_USER_OR_PASS: {
			code: 'LOGIN_01',
            message: 'Login failure: missing username or password.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please enter your username and password'
            }
        },
        NO_MATCHING_EMAIL: {
            code: 'LOGIN_02',
            message: 'Login failure: non-existent username (email).',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'There is no account established with this email address.  Please try any alternative email addresses you use'
            }
        },
        ACCOUNT_INACTIVE: {
            code: 'LOGIN_03',
            message: 'Login failure: account inactive.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'The password for this account needs to be reset. Hit "Forgot?" to reset'
            }
        },
        INCORRECT_PASSWORD: {
            code: 'LOGIN_04',
            message: 'Login failure: incorrect password.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'The password you entered is incorrect, please try again.  If you are unable to recall your password, hit "Forgot?" on the login form to reset it'
            }
        },
        UNEXPECTED_ERROR: {
            code: 'LOGIN_00',
            message: 'Login failure: unexpected error.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try again.  If this error persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        }
    },
    REGISTRATION: {
        INVALID_EMAIL_FORMAT: {
			code: 'REG_01',
            message: 'Registration failure: invalid email format.',
            flashMessage: {
                title: REGISTRATION_ERROR_FLASH_MESSAGE_TITLE,
                detail: "The email address you've entered is invalid.  Please enter in format <i>user@mareinc.org</i>"
            }
        },
        DUPLICATE_EMAIL: {
            code: 'REG_02',
            message: 'Registration failure: existing email address.',
            flashMessage: {
                title: REGISTRATION_ERROR_FLASH_MESSAGE_TITLE,
                detail: "There is already an account established with this email address.  If you've forgotten your password, please reset"
            }
        },
        PASSWORD_MISMATCH: {
            code: 'REG_03',
            message: 'Registration failure: passwords do not match.',
            flashMessage: {
                title: REGISTRATION_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'The passwords you entered do not match. Please re-enter'
            }
        },
        USER_SAVE_ERROR: {
            code: 'REG_04',
            message: 'Registration failure: User model creation error.',
            flashMessage: {
                title: REGISTRATION_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'If this error persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a> for assistance'
            }
        },
        UNEXPECTED_ERROR: {
            code: 'REG_00',
            message: 'Registration failure: unexpected error.',
            flashMessage: {
                title: REGISTRATION_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'If this error persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a> for assistance'
            }
        }
    }
};

// log errors in a standardized format with unique error codes
exports.logCodedError = function logCodedError( code, message, detail ) {

	if ( code && message ) {
		
		console.error( `ERROR (CODE:${code}) - ${message}` );

		if (detail) {
			console.error( `DETAIL (CODE:${code}) - ${detail}` );
		}
	}
};