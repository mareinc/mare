(function () {
	'use strict';

	mare.routers.Tools = Backbone.Router.extend({
		
		routes: {
			''											: 'loadDefault',
			'dashboard'									: 'loadDashboard',
			'dashboard/:fromDate/:toDate'				: 'loadDashboardByDateRange',
			'family-matching'							: 'loadFamilyMatchingRequest',
			'family-matching/:familyID(?*queryString)'	: 'loadFamilyMatching',
			'child-matching'							: 'loadChildMatchingRequest',
			'child-matching/:childID(?*queryString)'	: 'loadChildMatching',
			'*other'									: 'loadDefault'
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
		
		loadFamilyMatching: function( familyID, queryString ) {
			mare.views.tools.showFamilyMatching( familyID, this.parseQueryString( queryString ) );
		},
		
		loadChildMatching: function( childID, queryString ) {
			mare.views.tools.showChildMatching( childID, this.parseQueryString( queryString ) );
		},
		
		loadFamilyMatchingRequest: function() {
			mare.views.tools.showFamilyMatchingRequest();
		},
		
		loadChildMatchingRequest: function() {
			mare.views.tools.showChildMatchingRequest();
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
