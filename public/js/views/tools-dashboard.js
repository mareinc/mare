(function () {
	'use strict';

	mare.views.Dashboard = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		// bind standard events to functions within the view
		events: {
			'click .btn-dashboard'	: 'handleSearchClick'
		},

		/* initialize the view */
		initialize: function() {
			var toolsDashboardTemplateHtml = $( '#tools-dashboard-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.dashboardTemplate = Handlebars.compile( toolsDashboardTemplateHtml );
		},

		/* render the view onto the page */
		render: function( fromDate, toDate ) {
			var view = this;

			view.$el.html( '' );
			this.getDataPromise( fromDate, toDate ).done( function( data ) {
				var dashboardHtml = view.dashboardTemplate( data );

				view.$el.html( dashboardHtml );
			});
		},
		
		handleSearchClick: function() {
			mare.routers.tools.navigate( 'dashboard/' + this.$el.find( '[name="fromDate"]' ).val() + '/' + this.$el.find( '[name="toDate"]' ).val(), { trigger: true } );
		},
		
		getDataPromise: function( fromDate, toDate ) {
			var queryParams = {};
			
			if ( fromDate && toDate ) {
				queryParams = {
					fromDate: fromDate,
					toDate: toDate
				};
			}
			
			return $.Deferred( function( defer ) {
				$.ajax({
					dataType: 'json',
					url: '/tools/services/get-dashboard-data',
					data: queryParams,
					type: 'GET'
				}).done( function( data ) {
					if ( data.status === 'error' ) {
						// display the flash message
						mare.views.flashMessages.initializeAJAX( data.flashMessage );
						defer.reject();
					} else {
						defer.resolve( data );
					}
				}).fail( function( err ) {
					console.log( err );
					defer.reject();
				});
			}).promise();
		}
		
	});
}());
