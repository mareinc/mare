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
		},
		
		showDashboard: function( fromDate, toDate ) {
			mare.views.dashboard.render( fromDate, toDate );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__dashboard');
		},
		
		showFamilyMatching: function( familyID, params ) {
			mare.views.familyMatching.render( familyID, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__family-matching');
		},
		
		showChildMatching: function( childID, params ) {
			mare.views.childMatching.render( childID, params );
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
		}
		
	});
}());
