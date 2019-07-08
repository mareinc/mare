(function () {
	'use strict';

	mare.routers.ChildRegistration = Backbone.Router.extend({

		routes: {
			''			: 'loadDefault',
			'create'	: 'createChild',
			'edit'		: 'editChild'
		},

		initialize: function initialize() {
			// create a view for the child registration form
			mare.views.childRegistration = mare.views.childRegistration || new mare.views.ChildRegistration();
		},

		/* 	handle any poorly formed routes or navigation to the child registration page without specifying a route by rerouting to the create child form */
		loadDefault: function loadDefault() {
			// route to the create child form without triggering Backbone history with 'replace' to prevent the back button from reloading the bad route
			this.navigate( 'create', { trigger: true, replace: true } );
		},

		createChild: function createChild() {
			// use the view for the waiting child profiles page as a whole to display the correct area
			mare.views.childRegistration.showCreateChildForm();
		},

		editChild: function editChild() {
			// use the view for the waiting child profiles page as a whole to display the correct area
			mare.views.childRegistration.showEditChildForm();
		}

	});

}());
