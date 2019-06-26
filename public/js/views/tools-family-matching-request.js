(function () {
	'use strict';

	mare.views.FamilyMatchingRequest = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .family-search-button' : 'handleSearchClick'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-family-matching-request-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},
		
		initializeFamilySelects: function() {
			this.$el.find( '.family-select' ).select2({
				placeholder: 'Select family',
				ajax: {
					url: '/tools/services/get-families-data',
					dataType: 'json'
				}
			});
		},
		
		handleSearchClick: function handleSearchClick() {
			mare.routers.tools.navigate( 'family-matching/' + this.$el.find( '.family-select' ).val(), { trigger: true } );
		},

		/* render the view onto the page */
		render: function render() {
			var html = this.template( { } );

			this.$el.html( html );
			this.initializeFamilySelects();
		}
		
	});
}());
