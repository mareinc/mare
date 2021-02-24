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

}, 'Mailing List Subscriptions', {

    mailingLists: { type: Types.Relationship, label: 'mailing lists', ref: 'Mailchimp List', many: true, noedit: true }

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
	const hasMailingListSubscriptions = false; // disable this functionality until it can be updated to work with the new mailing list approach
	const oldEmailAddress = this._original ? this._original.email : this.email;
	const newEmailAddress = this.email;

	if ( hasMailingListSubscriptions && oldEmailAddress !== newEmailAddress ) {
		// if updates are required...
		// get all mailing lists the user is subscribed to
		keystone.list( 'Mailchimp List' ).model
			.find( { _id: { $in: this.mailingLists } } )
			.exec()
			// update each mailing list with the new email address
			.then( mailingListDocs => Promise.all( mailingListDocs.map( mailingListDoc => MailchimpService.updateMemberEmail( oldEmailAddress, newEmailAddress, mailingListDoc.mailchimpId ) ) ) )
			// log any errors
			.catch( error => console.error( `Failed to update user's email address on Mailchimp mailing lists. Old email address: ${oldEmailAddress}. New email address: ${newEmailAddress}\n${error}` ) )
			// continue save execution regardless of success/failure of email subscription updates
			.finally( () => next() );
	} else {
		// if no updates are required...
		// continue save execution
		next();
	}
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'email';
User.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = User;
