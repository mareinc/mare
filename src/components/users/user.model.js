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

// Post Save
User.schema.post( 'save', function() {
	'use strict';

	// if the save was initiated from the admin UI and this is the first save, subscribe the user to the mailing list
	// createdBy will be set to some id if it was created from the admin UI, otherwise it will be undefined
	// createdAt and updatedAt will be the same value only on the first save
	if ( this.createdBy && this.createdAt == this.updatedAt ) {
		
		// try to populate the state of residence so it can be used as a tag
		this.populate( 'address.state' )
			.execPopulate()
			.then( () => {
				// subscribe to the global mailing list
				return mailchimpService.subscribeMemberToList({
					email: this.email,
					mailingListId: process.env.MAILCHIMP_AUDIENCE_ID,
					userType: this.userType,
					firstName: this.userType === 'family'
						? this.contact1.name.first
						: this.name.first, 
					lastName: this.userType === 'family'
						? this.contact1.name.last
						: this.name.last,
					tags: [ 
						// user type tag
						this.userType,
						// state abbreviation
						this.address.state && this.address.state.abbreviation
					// filter out any undefined or empty tags
					].filter( tag => !!tag )
				});
			})
			.catch( err => {
				// log any errors with subscription process
				console.error( new Error( `Automatic subscription to mailing lists failed for user ${ this.email }` ) );
				console.error( err );
			});
	
	// if this was not the first save, see if the email address or state of residence tags need to be updated
	} else {
		
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
		const newStateOfResidence = this.address.state && this.address.state.toString();
		const oldStateOfResidence = this._original 
			? this._original.address.state && this._original.address.state.toString() 
			: newStateOfResidence;
		
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
	}
});

// Post delete
User.schema.post( 'remove', function( userDoc ) {

	// log the deletion
	console.log( `User ${userDoc.email} has been removed` );

	// unsubscribe the user from mailchimp
	mailchimpService.unsubscribeMemberFromList( userDoc.email, process.env.MAILCHIMP_AUDIENCE_ID )
		.then( () => console.log( `${userDoc.email} has been successfully unsubscribed from mailchimp` ) )
		.catch( error => {
			// if the member simply does not exist in the list, ignore the error
			if ( error.status !== 404 ) {
				// otherwise, log the error
				console.error( `Failed to unsubscribe user (${userDoc.email}) from mailchimp` );
				console.error( error );
			}
		});
});

// Define default columns in the admin interface and register the model
User.defaultColumns = 'email';
User.register();

// Export to make it available using require.  The keystone.list import throws a ReferenceError when importing a list
// that comes later when sorting alphabetically
exports = module.exports = User;
