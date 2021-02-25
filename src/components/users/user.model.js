var keystone			= require( 'keystone' ),
	Types				= keystone.Field.Types,
	MailchimpService 	= require( '../mailchimp lists/mailchimp-list.controllers' );

// Create model
var User = new keystone.List( 'User', {
	hidden: true
});

// Create fields
User.add( 'Login Information', {

	email: { type: Types.Email, label: 'email address', initial: true },
	password: { type: Types.Password, label: 'password', min: 0, initial: true },
	resetPasswordToken: { type: Types.Text, hidden: true, noedit: true }

}, {

	userType: { type: Types.Text, hidden: true }

});

// Post Init - used to store all the values before anything is changed
User.schema.post( 'init', function() {
	'use strict';

	this._original = this.toObject();
});

// Pre Save
User.schema.pre( 'save', function( next ) {
	'use strict';

	// check to see if mailing list subscriptions should be updated
	const oldEmailAddress = this._original ? this._original.email : this.email;
	const newEmailAddress = this.email;

	// if updates are required...
	if ( oldEmailAddress !== newEmailAddress ) {
		
		MailchimpService.updateMemberEmail( oldEmailAddress, newEmailAddress, process.env.MAILCHIMP_AUDIENCE_ID )
			.then( () => console.log( `Successfully updated user's email address in mailchimp - ${newEmailAddress}` ) )
			.catch( error => {

				// if the member simply does not exist in the list, ignore the error
				if ( error.status !== 404 ) {
					// otherwise, log the error
					console.error( `Failed to upate user's email address in mailchimp - ${newEmailAddress}` );
					console.error( error );
				}
			});
	}

	// continue saving the user
	next();
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'email';
User.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = User;
