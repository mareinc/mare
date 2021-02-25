var keystone			= require( 'keystone' ),
	Types				= keystone.Field.Types,
	mailchimpService 	= require( '../mailchimp lists/mailchimp-list.controllers' );

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

	// if email updates are required...
	if ( oldEmailAddress !== newEmailAddress ) {
		
		mailchimpService.updateMemberEmail( oldEmailAddress, newEmailAddress, process.env.MAILCHIMP_AUDIENCE_ID )
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

	// check to see if state of residence tags should be updated
	const oldStateOfResidence = this._original ? this._original.address.state : this.address.state;
	const newStateOfResidence = this.address.state;

	// if state updates are required...
	if ( oldStateOfResidence !== newStateOfResidence ) {
		
		// populate the state date so we can access the abbreviation
		keystone.list( 'State' ).model
			.find({ _id: { $in: [ oldStateOfResidence, newStateOfResidence ] } } )
			.exec()
			.then( stateDocs => {

				// get the abbreviations from the populated state docs
				const oldState = stateDocs.find( stateDoc => stateDoc._id.toString() == oldStateOfResidence );
				const newState = stateDocs.find( stateDoc => stateDoc._id.toString() == newStateOfResidence );
				// configure the tag updates
				const tagUpdates = [{
					// remove the old state tag
					name: oldState && oldState.abbreviation,
					status: 'inactive'
				}, {
					// add the new state tag
					name: newState && newState.abbreviation,
					status: 'active'
				// remove any empty tags (e.g. if old or new state are undefined)
				}].filter( tagUpdate => tagUpdate.name );

				// apply the tag updates in mailchimp
				return mailchimpService.updateMemberTags( this.email, tagUpdates, process.env.MAILCHIMP_AUDIENCE_ID );
			})
			.then( () => console.log( `Successfully updated user's (${this.email}) state of residence tag in mailchimp` ) )
			.catch( error => {

				// if the member simply does not exist in the list, ignore the error
				if ( error.status !== 404 ) {
					// otherwise, log the error
					console.error( `Failed to upate user's (${this.email}) state of residence tag in mailchimp` );
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
