(function () {
	'use strict';

	mare.routers.Tools = Backbone.Router.extend({
		
		routes: {
			''								: 'loadDefault',
			'dashboard'						: 'loadDashboard',
			'dashboard/:fromDate/:toDate'	: 'loadDashboardByDateRange',
			'family-matching'				: 'loadFamilyMatching',
			'child-matching'				: 'loadChildMatching',
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
		
		loadFamilyMatching: function() {
			mare.views.tools.showFamilyMatching();
		},
		
		loadChildMatching: function() {
			mare.views.tools.showChildMatching();
		},
		
		loadDefault: function() {
			this.navigate( 'dashboard', { trigger: true, replace: true } );
		}

	});

}());
