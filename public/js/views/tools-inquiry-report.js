(function () {
	'use strict';

	mare.views.InquiryReport = Backbone.View.extend({
		// this view controls everything inside the element with class 'dashboard-content'
		el: '.dashboard-content',

		/* initialize the view */
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

		/* render the view onto the page */
		render: function( fromDate, toDate ) {
            var view = this;

            view.$el.html( view.template() );

            // initialize select inputs
            view.initializeSourceSelect();
            view.initializeInquirerSelect();
			view.initializeInquiryMethodSelect();
			view.initializeInquiryTypeSelect();
			
			// if the from and to dates are not passed in, set them using the defaults
			if ( !fromDate || !toDate ) {
				this.$el.find( '[name="fromDate"]' ).val( this.$el.find( '[name="defaultFromDate"]' ).val() );
				this.$el.find( '[name="toDate"]' ).val( this.$el.find( '[name="defaultToDate"]' ).val() );
			}
		}
	});
}());
