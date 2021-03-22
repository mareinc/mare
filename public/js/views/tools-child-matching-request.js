(function () {
	'use strict';

	mare.views.ChildMatchingRequest = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .child-search-button': 'handleSearchClick'
		},

		/* initialize the view */
		initialize: function initialize() {
			var templateHtml = $( '#tools-child-matching-request-template' ).html();
			
			// compile the templates to be used during rendering/repainting
			this.template = Handlebars.compile( templateHtml );
		},
		
		initializeChildSelects: function() {
			this.$el.find( '.child-select' ).select2({
				placeholder: 'Select child',
				ajax: {
					url: '/tools/services/get-children-data?includeAnon=true',
					dataType: 'json'
				}
			});
		},
		
		handleSearchClick: function handleSearchClick() {
			var selectedChild = this.$el.find( '.child-select' ).val();

			mare.routers.tools.navigate( 'child-matching/' + selectedChild, { trigger: true } );
		},

		/* render the view onto the page */
		render: function render() {
			var html = this.template( { } );

			this.$el.html( html );
			this.initializeChildSelects();
			
			$( window ).scrollTop( 0 );
		}
		
	});
}());
