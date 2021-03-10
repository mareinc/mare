(function () {
	'use strict';

	mare.views.AccountEmailList = Backbone.View.extend({
		el: '.account-email-list-container',

		events: {
			'change .mailing-list-preference'	: 'handleMailingListPreferenceChanged',
			'click	#preference-btn'			: 'handleSaveButtonClicked'
		},

		initialize: function initialize() {
			// create a hook to access the section templates
			var html = $( '#account-email-list' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );
			// create a placeholder for preference updates
			this.mailingListUpdates = [];
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );
		},
		
		hide: function hide() {
			// hide the section
			this.$el.hide();
			// remove the contents of the view
			this.$el.empty();
			// NOTE: if any events are bound to DOM elements, they should be explicitly removed here as well
		},

		show: function show() {
			this.$el.show();
		},

		handleMailingListPreferenceChanged: function handleMailingListPreferenceChanged( event ) {

			// reset mailing list updates
			var mailingListUpdates = this.mailingListUpdates = [];
			
			// check to see if there are one or more preferences that have been updated from their original value
			$( '.mailing-list-preference' ).each( function() {

				var $preference = $( this );
				var isChecked = $preference.prop( 'checked' );
				// if preference has been updated
				if ( $preference.data( 'initialState' ) !== isChecked ) {
					// add it to the updates list
					mailingListUpdates.push({
						groupId: $preference.val(),
						status: isChecked ? 'active' : 'inactive'
					});
				}
			});

			// update the disabled state of the save button
			this.updateSaveButtonDisabledState();
		},

		handleSaveButtonClicked: function handleSaveButtonClicked( event ) {

			var view = this;
			
			// if there are mailing list updates
			if ( view.mailingListUpdates.length > 0 ) {

				// create a copy of the pending updates
				var pendingUpdates = view.mailingListUpdates.slice();
				// reset mailing list updates
				view.mailingListUpdates = [];
				// update the disabled state of the save button
				view.updateSaveButtonDisabledState();

				$.ajax({
					dataType: 'json',
					url: '/services/update-mailing-lists',
					type: 'POST',
					data: { updates: pendingUpdates }
				}).done( function( responseData ) {
	
					if ( responseData.status === 'success' ) {

						// initialize and show the success flash message
						mare.views.flashMessages.initializeAJAX( responseData.flashMessage );

					} else {

						// if the error was handled on the server
						if ( responseData.status === 'error' ) {

							// initialize and show the error flash message
							mare.views.flashMessages.initializeAJAX( responseData.flashMessage );

						// if the error was unhandled
						} else {

							// log the response
							console.error( responseData );
						}

						// re-apply the pending updates
						view.mailingListUpdates = pendingUpdates;
					}

					// update the disabled state of the save button
					view.updateSaveButtonDisabledState();

				}).fail( function( err ) {

					// log the unhandled error
					console.error( err );
					// re-apply the pending updates
					view.mailingListUpdates = pendingUpdates;
					// update the disabled state of the save button
					view.updateSaveButtonDisabledState();
				});
			}
		},

		updateSaveButtonDisabledState: function updateSaveButtonDisabledState() {
			$( '#preference-btn' ).prop( 'disabled', this.mailingListUpdates.length === 0 );
			$( '#preference-btn' ).toggleClass( 'button--disabled', this.mailingListUpdates.length === 0 );
		}
	});
}());
