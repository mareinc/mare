(function () {
	'use strict';

	mare.views.InquiryReport = Backbone.View.extend({
		
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		initialize: function() {
			var toolsInquiryReportTemplate = $( '#tools-inquiry-report-template' ).html();
			
			// compile the templates to be used during rendering/repainting the gallery
			this.template = Handlebars.compile( toolsInquiryReportTemplate );
        },
        
        initializeSourceSelect: function() {
			this.$el.find( '.source-select' ).select2({
                placeholder: 'All Sources',
				ajax: {
					url: '/tools/services/get-sources-data',
					dataType: 'json'
				}
            });
        },
        
        initializeInquirerSelect: function() {
			this.$el.find( '.inquirer-select' ).select2({
                placeholder: 'All Inquirers'
            });
        },
        
        initializeInquiryMethodSelect: function() {
            this.$el.find( '.inquiry-method-select' ).select2({
                placeholder: 'All Inquiry Methods'
            });
        },

        initializeInquiryTypeSelect: function() {
            this.$el.find( '.inquiry-type-select' ).select2({
                placeholder: 'All Inquiry Types'
            });
        },

		render: function( fromDate, toDate ) {
            var view = this;
			
			// if the from and to dates are not passed in, set them using the defaults
			if ( !fromDate || !toDate ) {
				view.$el.html( view.template() );

				// initialize select inputs
				view.initializeSourceSelect();
				view.initializeInquirerSelect();
				view.initializeInquiryMethodSelect();
				view.initializeInquiryTypeSelect();

				view.$el.find( '[name="fromDate"]' ).val( view.$el.find( '[name="defaultFromDate"]' ).val() );
				view.$el.find( '[name="toDate"]' ).val( view.$el.find( '[name="defaultToDate"]' ).val() );
				
			// otherwise, set the from and to dates using the route params
			} else {

				view.$el.html( view.template({
					waitingForResults: true
				}));
				view.initializeSourceSelect();
				view.initializeInquirerSelect();
				view.initializeInquiryMethodSelect();
				view.initializeInquiryTypeSelect();

				view.getInquiryData( fromDate, toDate )
					.done( function( data ) {

						console.log(data);

						view.$el.html( view.template( data ) );

						view.$el.find( '[name="fromDate"]' ).val( fromDate );
						view.$el.find( '[name="toDate"]' ).val( toDate );

						view.initializeSourceSelect();
						view.initializeInquirerSelect();
						view.initializeInquiryMethodSelect();
						view.initializeInquiryTypeSelect();
					});
			}
		},

		getInquiryData: function( fromDate, toDate ) {
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
					url: '/tools/services/get-inquiry-data',
					data: queryParams,
					type: 'GET'
				})
				.done( function( data ) {
					if ( data.status === 'error' ) {
						// display the flash message
						mare.views.flashMessages.initializeAJAX( data.flashMessage );
						defer.reject();
					} else {
						defer.resolve( data );
					}
				})
				.fail( function( err ) {
					console.log( err );
					defer.reject();
				});
			}).promise();
		}
	});
}());
