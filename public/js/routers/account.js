(function () {
	'use strict';

	mare.routers.Account = Backbone.Router.extend({

		routes: {
			''				: 'loadDefault',
			'info'			: 'loadInfo',
			'email-list'	: 'loadEmailList',
			'events'		: 'loadEvents',
			'donations'		: 'loadDonations',
			'children'		: 'loadChildren',
			'*other'		: 'loadDefault'
		},

		initialize: function initialize() {
			mare.views.account = mare.views.account || new mare.views.Account();
		},

		loadInfo: function loadInfo() {
			mare.views.account.openSection( 'info' );
		},

		loadEmailList: function loadEmailList() {
			mare.views.account.openSection( 'email-list' );
		},

		loadEvents: function loadEvents() {
			mare.views.account.openSection( 'events' );
		},

		loadDonations: function loadDonations() {
			mare.views.account.openSection( 'donations' );
		},

		loadChildren: function loadChildren() {
			mare.views.account.openSection( 'children' );
		},

		/* handle any poorly formed routes or navigation to the account info page */
		loadDefault: function loadDefault() {
			this.navigate( 'info', { trigger: true, replace: true } );
		}

	});

}());
