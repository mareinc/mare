
// define error codes, logging, and messaging
const LOGIN_ERROR_FLASH_MESSAGE_TITLE = 'Something went wrong';
const REGISTRATION_ERROR_FLASH_MESSAGE_TITLE = 'There was a problem creating your account';
const PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE = 'There was an error with your password reset request';
const ACCOUNT_VERIFY_ERROR_FLASH_MESSAGE_TITLE = 'There was an error verifying your account';

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
        ALTERNATIVE_EMAIL_DOMAIN: {
            code: 'LOGIN_05',
            message: 'Login failure: Social Worker attempted login with incorrect email domain.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE
                // detail will be created dynamically 
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
        ACCOUNT_UNVERIFIED: {
            code: 'LOGIN_06',
            message: 'Login failure: account unverified.',
            flashMessage: {
                title: LOGIN_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Your account has not been verified.  Please check your inbox for verification instructions from MARE'
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
        },
        SUCCESS: {
            code: 'LOGIN_SUCCESS',
            message: 'Login success.'
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
                detail: 'There is already an account established with this email address.  If you\'ve forgotten your password, please reset it using the "Forgot?" link on the login form'
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
        VERIFICATION_EMAIL_SEND_ERROR: {
            code: 'REG_05',
            message: 'Registration failure: Verification email send error.',
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
        },
        SUCCESS: {
            code: 'REG_SUCCESS',
            message: 'Registration success.',
            flashMessage: {
                title: 'Success',
                // detail will be created dynamically 
            }
        }
    },
    PASSWORD_FORGOT: {
        INVALID_EMAIL_FORMAT: {
			code: 'PWF_01',
            message: 'Forgotten password failure: invalid email format.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: "The email address you've entered is invalid.  Please enter in format <i>user@mareinc.org</i>"
            }
        },
        NO_MATCHING_EMAIL: {
            code: 'PWF_02',
            message: 'Forgotten password failure: non-existent username (email).',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'There is no account established with this email address.  Please try any alternative email addresses you use'
            }
        },
        RESET_TOKEN_SAVE_FAIL: {
            code: 'PWF_03',
            message: 'Forgotten password failure: failed to save reset token on user model.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        RESET_EMAIL_SEND_FAIL: {
            code: 'PWF_04',
            message: 'Forgotten password failure: failed to send reset email to user.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        UNEXPECTED_ERROR: {
            code: 'PWF_00',
            message: 'Forgotten password failure: unexpected error.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        SUCCESS: {
            code: 'PWF_SUCCESS',
            message: 'Forgotten password success: created reset token.',
            flashMessage: {
                title: 'Success',
                detail: 'We have emailed you a link to reset your password.  Please follow the instructions in your email.'
            }
        }
    },
    PASSWORD_RESET: {
        NO_RESET_TOKEN: {
            code: 'PWR_01',
            message: 'Reset password failure: no reset token provided.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        NO_USER_WITH_MATCHING_TOKEN: {
            code: 'PWR_02',
            message: 'Reset password failure: no user with matching reset token.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        PASSWORD_SAVE_FAIL: {
            code: 'PWR_03',
            message: 'Reset password failure: could not save user record with updated password.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        UNEXPECTED_ERROR: {
            code: 'PWR_00',
            message: 'Reset password failure: unexpected error.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try using the forgot password button again.  If the issue persists, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        SUCCESS: {
            code: 'PWR_SUCCESS',
            message: 'Password reset success: password updated.',
            flashMessage: {
                title: 'Success',
                detail: 'The password for your account has been successfully updated.'
            }
        }
    },
    ACCOUNT_VERIFICATION: {
        NO_VERIFICATION_CODE: {
            code: 'VRFY_01',
            message: 'Account verification failure: no verification code provided.',
            flashMessage: {
                title: ACCOUNT_VERIFY_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try to verify your account again by clicking on the link in the verification email.  Even if you are unable to verify your account, you are still be able to log in an use the site.  If you continue to experience issues, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        NO_MATCHING_VERIFICATION_RECORD: {
            code: 'VRFY_02',
            message: 'Account verification failure: no verification record with matching code.',
            flashMessage: {
                title: ACCOUNT_VERIFY_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try to verify your account again by clicking on the link in the verification email.  Even if you are unable to verify your account, you are still be able to log in an use the site.  If you continue to experience issues, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        USER_UPDATE_FAILED: {
            code: 'VRFY_03',
            message: 'Account verification failure: could not update verification status on user record.',
            flashMessage: {
                title: ACCOUNT_VERIFY_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try to verify your account again by clicking on the link in the verification email.  Even if you are unable to verify your account, you are still be able to log in an use the site.  If you continue to experience issues, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        ALREADY_VERIFIED: {
            code: 'VRFY_04',
            message: 'Account verification failure: account already verified.',
            flashMessage: {
                title: ACCOUNT_VERIFY_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'You have already verified this email address and should be able to log in to your MARE account. If you are experiencing issues logging in, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        },
        UNEXPECTED_ERROR: {
            code: 'VRFY_00',
            message: 'Account verification failure: unexpected error.',
            flashMessage: {
                title: PASSWORD_RESET_ERROR_FLASH_MESSAGE_TITLE,
                detail: 'Please try to verify your account again by clicking on the link in the verification email.  Even if you are unable to verify your account, you are still be able to log in an use the site.  If you continue to experience issues, please contact <a href="mailto:web@mareinc.org">web@mareinc.org</a>'
            }
        }
    },
    INQUIRY: {
        MISSING_RECORD_URL: {
            code: 'INQUIRY_01',
            message: 'Inquiry Creation Failure: Inquirer is missing Keystone Record URL.'
        },
        BAD_RECORD_TYPE: {
            code: 'INQUIRY_02',
            message: 'Inquiry Creation Failure: Inquirer has incorrect or malformed Keystone Record Type.'
        },
        BAD_RECORD_ID: {
            code: 'INQUIRY_03',
            message: 'Inquiry Creation Failure: Inquirer has malformed Keystone Record ID.'
        },
        MISSING_RECORD: {
            code: 'INQUIRY_04',
            message: `Inquiry Creation Failure: could not find Inquirer's Keystone Record.`
        },
        INQUIRY_CREATION_FAILED: {
            code: 'INQUIRY_05',
            message: `Inquiry Creation Failure: there was an error during the creation of the Inquiry Record.`
        },
        INQUIRY_DATA_AGGREGATION_FAILED: {
            code: 'INQUIRY_06',
            message: `Inquiry Notification Failure: there was an error aggregating Inquiry data for the notification email.`
        },
        INQUIRER_DATA_AGGREGATION_FAILED: {
            code: 'INQUIRY_07',
            message: `Inquiry Notification Failure: there was an error aggregating Inquirer data for the notification email.`
        },
        NOTIFICATION_EMAIL_TARGET_NOT_FOUND: {
            code: 'INQUIRY_08',
            message: `Inquiry Notification Failure: there was an error getting the targets for the notification email.`
        },
        NOTIFICATION_EMAIL_SEND_FAILED: {
            code: 'INQUIRY_09',
            message: `Inquiry Notification Failure: there was an error sending the notification email.`
        }
    }
};

// log errors in a standardized format with unique error codes
exports.logCodedError = function logCodedError( code, message, detail, isSuccess ) {

	if ( code && message ) {

		console.error( `${isSuccess ? 'SUCCESS' : 'ERROR'} (CODE:${code}) - ${message}` );

		if (detail) {
			console.error( `DETAIL (CODE:${code}) - ${detail}` );
		}
	}
};
