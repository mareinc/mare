(function () {
	'use strict';

	mare.routers.Account = Backbone.Router.extend({

		routes: {
			''						: 'loadDefault',
			'info'					: 'loadInfo',
			'email-list'			: 'loadEmailList',
			'events'				: 'loadEvents',
			'children'				: 'loadChildren',
            'inquiries'     		: 'loadInquiries',
			'registration-links'	: 'loadRegistrationLinks',
			'*other'				: 'loadDefault'
		},

		initialize: function initialize() {
			// create a promise to resolve once we have permissions for the user (All actions are verified on the server so this won't introduce any risk)
			mare.promises.permissionsLoaded = $.Deferred();
			// fetch the users permissions
			this.getPermissions();

			mare.views.account = mare.views.account || new mare.views.Account();
			// bind listener for the dropdown menu changing
			mare.views.account.on( 'changeRoute', this.updateRoute.bind( this ) );
		},

		getPermissions: function getPermissions() {
			// fetch permissions for the current user
			$.ajax({
				dataType: 'json',
				url: '/services/get-gallery-permissions',
				type: 'POST'
			}).done( function( permissions ) {
				// store the permissions on the namespace to allow us to access them in all views and subviews for this page
				mare.permissions.gallery = permissions;
				// resolve the promise tracking permissions loading
				mare.promises.permissionsLoaded.resolve();

			}).fail( function( err ) {
				// TODO: show an error message if we failed to fetch the permissions
				console.log( err );
			});
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

        loadInquiries: function loadInquiries() {
            mare.views.account.openInquiriesSection();
        },

		loadRegistrationLinks: function loadRegistrationLinks() {
			mare.views.account.openRegistrationLinkSection();
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
