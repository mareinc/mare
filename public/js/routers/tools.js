(function () {
	'use strict';

	mare.routers.Tools = Backbone.Router.extend({
		
		routes: {
			''													: 'loadDefault',
			'dashboard'											: 'loadDashboard',
			'dashboard/:fromDate/:toDate'						: 'loadDashboardByDateRange',
			'family-matching'									: 'loadFamilyMatchingRequest',
			'family-matching/:familyId(?*queryString)'			: 'loadFamilyMatching',
			'child-matching'									: 'loadChildMatchingRequest',
			'child-matching/:childId(?*queryString)'			: 'loadChildMatching',
			'inquiry-report'									: 'loadInquiryReport',
			'inquiry-report/:fromDate/:toDate(?*queryString)'	: 'loadInquiryReport',
			'placement-report'									: 'loadPlacementReport',
			'placement-report/:fromDate/:toDate(?*queryString)'	: 'loadPlacementReport',
			'*other'											: 'loadDefault'
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
		
		loadFamilyMatching: function( familyId, queryString ) {
			mare.views.tools.showFamilyMatching( familyId, this.parseQueryString( queryString ) );
		},
		
		loadChildMatching: function( childId, queryString ) {
			mare.views.tools.showChildMatching( childId, this.parseQueryString( queryString ) );
		},
		
		loadFamilyMatchingRequest: function() {
			mare.views.tools.showFamilyMatchingRequest();
		},
		
		loadChildMatchingRequest: function() {
			mare.views.tools.showChildMatchingRequest();
		},

		loadInquiryReport: function( fromDate, toDate, queryString ) {
			mare.views.tools.showInquiryReport( fromDate, toDate, this.parseQueryString( queryString ) );
		},

		loadPlacementReport: function( fromDate, toDate, queryString ) {
			mare.views.tools.showPlacementReport( fromDate, toDate, this.parseQueryString( queryString ) );
		},
		
		loadDefault: function() {
			this.navigate( 'dashboard', { trigger: true, replace: true } );
		},
		
		parseQueryString: function( queryString ) {
			var params = {};
			
			if ( queryString ) {
				var components = decodeURI( queryString ).split( /&/g );
				
				_.each( components, function( component ) {
					var componentSplit = component.split( '=' );
					
					if ( componentSplit.length >= 1 ) {
						var value,
							name = componentSplit[ 0 ];
						
						if ( componentSplit.length === 2 ) {
							value = componentSplit[ 1 ];
						}
						
						if ( name.includes( '[]' ) ) {
							if ( ! _.isArray( params[ name ] ) ) {
								params[ name ] = [];
							}
							params[ name ].push( value );
						} else {
							params[ name ] = value;
						}
					}
				});
			}
			
			return params;
		}

	});

}());
