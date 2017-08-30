(function () {
	'use strict';

	mare.routers.Account = Backbone.Router.extend({

		routes: {
			''				: 'loadDefault',
			'info'			: 'loadInfo',
			'email-list'	: 'loadEmailList',
			'events'		: 'loadEvents',
			'children'		: 'loadChildren',
			'*other'		: 'loadDefault'
		},

		initialize: function initialize() {
			mare.views.account = mare.views.account || new mare.views.Account();
			// bind listener for the dropdown menu changing
			mare.views.account.on( 'changeRoute', this.updateRoute.bind( this ) );
		},

		loadInfo: function loadInfo() {
			mare.views.account.openInfoSection();
		},

		loadChildren: function loadChildren() {
			mare.views.account.openChildrenSection();
		},

		loadEmailList: function loadEmailList() {
			mare.views.account.openEmailListSection();
		},

		loadEvents: function loadEvents() {
			mare.views.account.openEventsSection();
		},

		/* handle any poorly formed routes or navigation to the account info page */
		loadDefault: function loadDefault() {
			this.navigate( 'info', { trigger: true, replace: true } );
		},

		updateRoute: function updateRoute( route ) {
			// navigate to the specified route, triggering an update to the history state
			this.navigate( route, { trigger: true } );
		}
	});
}());
