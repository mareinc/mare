( function () {
	'use strict';

	mare.views.Tools = Backbone.View.extend({
		el: 'body',
	
		initialize: function initialize() {
			mare.views.dashboard = mare.views.dashboard || new mare.views.Dashboard();
			mare.views.familyMatching = mare.views.familyMatching || new mare.views.FamilyMatching();
			mare.views.childMatching = mare.views.childMatching || new mare.views.ChildMatching();
			mare.views.familyMatchingRequest = mare.views.familyMatchingRequest || new mare.views.FamilyMatchingRequest();
			mare.views.childMatchingRequest = mare.views.childMatchingRequest || new mare.views.ChildMatchingRequest();
			mare.views.inquiryReport = mare.views.inquiryReport || new mare.views.InquiryReport();
			mare.views.placementReport = mare.views.placementReport || new mare.views.PlacementReport();
		},

		initializeSideNav: function() {

			var view = this;

			// initialize the side nav if it isn't already
			if (!view.sideNavAPI) {

				// save a reference to the side nav API to allow future programmatic updates
				view.sideNavAPI = ( view.$el.find( '.menu-link' ).bigSlide({
					menu: ( '#sidebar' ),
					menuWidth: '323px',
					speed:'300',
					easyClose: true
				})).bigSlideAPI;

				// close the side nav when the close button is clicked
				view.$el.find( '#sidebar-close' )
					.on( 'click', function() {
						view.closeSideNav();
					});
			}
		},

		closeSideNav: function() {
			// if the side nav is open, close it
			if (this.sideNavAPI.model.state === 'open') {
				this.sideNavAPI.view.toggleClose();
			}
		},

		// destroys a table that has been created by a previous view
		destroyTable: function() {
			if ( this.table ) {
				this.table.destroy();
				this.table = undefined;
			}
		},

		// TODO: all the functions below should use a data-attribute instead of a class to specify what's shown
		// TODO: in order to save state in each area, they shouldn't render over eachother, but instead show/hide
		showDashboard: function( fromDate, toDate ) {
			// destroy an existing tables
			this.destroyTable();
			mare.views.dashboard.render( fromDate, toDate );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__dashboard');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showFamilyMatching: function( familyId, params ) {
			// destroy an existing tables
			this.destroyTable();
			mare.views.familyMatching.render( familyId, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__family-matching');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showChildMatching: function( childId, params ) {
			// destroy an existing tables
			this.destroyTable();
			mare.views.childMatching.render( childId, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__child-matching');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showFamilyMatchingRequest: function() {
			// destroy an existing tables
			this.destroyTable();
			mare.views.familyMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__family-matching');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showChildMatchingRequest: function() {
			// destroy an existing tables
			this.destroyTable();
			mare.views.childMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__child-matching');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showInquiryReport: function( fromDate, toDate, params ) {
			// destroy an existing tables
			this.destroyTable();
			mare.views.inquiryReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__inquiry-report');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		
		},

		showPlacementReport: function( fromDate, toDate, params ) {
			// destroy an existing tables
			this.destroyTable();
			mare.views.placementReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr('class', 'tools__placement-report');
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		}
	});
}());
