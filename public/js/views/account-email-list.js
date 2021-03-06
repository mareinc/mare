(function () {
	'use strict';

	mare.views.AccountEmailList = Backbone.View.extend({
		el: '.account-email-list-container',

		events: {
			'change .mailing-list-preference': 'handleMailingListPreferenceChanged'
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
			$( '#preference-btn' ).prop( 'disabled', mailingListUpdates.length === 0 );
			$( '#preference-btn' ).toggleClass( 'button--disabled', mailingListUpdates.length === 0 );
		}
	});
}());
