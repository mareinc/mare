(function () {
	'use strict';

	mare.views.EventAddUnregisteredAdult = Backbone.View.extend({
		// this view controls everything inside the element with class 'gallery'
		el: '.tbd',
		// bind standard events to functions within the view
		events: {
		},

		/* initialize the add unregistered adult modal */
		initialize: function initialize() {		
			// initialize the modal once we've fetched the social worker data needed to display the social worker dropdown
			mare.promises.socialWorkerDataLoaded.done( function() {
				this.socialWorkers = mare.collections.socialWorkers;
			}.bind( this ) );
		},

		/* render the view onto the page */
		render: function render( doneCallback ) {
			// store a reference to the view for inside callbacks where context is lost
			var view = this;
		}
	});
}());
