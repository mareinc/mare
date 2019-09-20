( function () {
	'use strict';

	mare.views.Tools = Backbone.View.extend({
		el: 'body',
		
		initialize: function initialize() {
			mare.views.dashboard = mare.views.dashboard || new mare.views.Dashboard();
			mare.views.familyMatching = mare.views.familyMatching || new mare.views.FamilyMatching();
			mare.views.childMatching = mare.views.childMatching || new mare.views.ChildMatching();
			mare.views.familyMatchingRequest = mare.views.familyMatchingRequest || new mare.views.FamilyMatchingRequest();
			mare.views.childMatchingRequest = mare.views.childMatchingRequest || new mare.views.ChildMatchingRequest();
			mare.views.inquiryReport = mare.views.inquiryReport || new mare.views.InquiryReport();
		},
		// TODO: all the functions below should use a data-attribute instead of a class to specify what's shown
		// TODO: in order to save state in each area, they shouldn't render over eachother, but instead show/hide
		showDashboard: function( fromDate, toDate ) {
			mare.views.dashboard.render( fromDate, toDate );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__dashboard');
		},
		
		showFamilyMatching: function( familyId, params ) {
			mare.views.familyMatching.render( familyId, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__family-matching');
		},
		
		showChildMatching: function( childId, params ) {
			mare.views.childMatching.render( childId, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__child-matching');
		},
		
		showFamilyMatchingRequest: function() {
			mare.views.familyMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__family-matching');
		},
		
		showChildMatchingRequest: function() {
			mare.views.childMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__child-matching');
		},

		showInquiryReport: function() {
			mare.views.inquiryReport.render();
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__inquiry-report');
		}
		
	});
}());
