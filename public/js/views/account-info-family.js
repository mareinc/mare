(function () {
	'use strict';

	mare.views.AccountInfoFamily = mare.views.AccountInfoBase.extend({

		initialize: function initialize() {

			// initialize the AccountInfoBaseView that this view inherits from
			mare.views.AccountInfoBase.prototype.initialize.apply( this );
		}
	});
}());
