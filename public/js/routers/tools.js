(function () {
	'use strict';

	mare.routers.Tools = Backbone.Router.extend({
		
		routes: {
			''								: 'loadDefault',
			'dashboard'						: 'loadDashboard',
			'dashboard/:fromDate/:toDate'	: 'loadDashboardByDateRange',
			'family-matching'				: 'loadFamilyMatchingRequest',
			'family-matching/:familyID'		: 'loadFamilyMatching',
			'child-matching'				: 'loadChildMatchingRequest',
			'child-matching/:childID'		: 'loadChildMatching',
			'*other'						: 'loadDefault'
		},

		initialize: function() {
			mare.views.tools = mare.views.tools || new mare.views.Tools();
		},
		
		loadDashboard: function() {
			mare.views.tools.showDashboard();
		},
		
		loadDashboardByDateRange: function( fromDate, toDate ) {
			mare.views.tools.showDashboard( fromDate, toDate );
		},
		
		loadFamilyMatching: function( familyID ) {
			mare.views.tools.showFamilyMatching( familyID );
		},
		
		loadChildMatching: function( childID ) {
			mare.views.tools.showChildMatching( childID );
		},
		
		loadFamilyMatchingRequest: function() {
			mare.views.tools.showFamilyMatchingRequest();
		},
		
		loadChildMatchingRequest: function() {
			mare.views.tools.showChildMatchingRequest();
		},
		
		loadDefault: function() {
			this.navigate( 'dashboard', { trigger: true, replace: true } );
		}

	});

}());
