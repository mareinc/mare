(function () {
	'use strict';

	mare.views.AccountInfoSiteVisitor = mare.views.AccountInfoBase.extend({

		childEvents: {
			'change #is-not-ma-city-checkbox' : 'toggleCitySelect'
		},

		initialize: function initialize() {

			// initialize the AccountInfoBaseView that this view inherits from
			mare.views.AccountInfoBase.prototype.initialize.apply( this );

			// DOM cache any commonly used elements to improve performance
			this.$MACityContainer			= this.$( '.city-container' );
			this.$NonMACityContainer		= this.$( '.non-ma-city-container' );
		},

		toggleCitySelect: function toggleCitySelect( event ) {
			// toggle showing of the MA city dropdown menu
			this.$MACityContainer.toggleClass( 'hidden' );
			// toggle showing of the city free text field
			this.$NonMACityContainer.toggleClass( 'hidden' );
		}
	});
}());
