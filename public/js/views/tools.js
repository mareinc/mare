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
			mare.views.mediaFeaturesReport = mare.views.mediaFeaturesReport || new mare.views.MediaFeaturesReport();
			mare.views.childListingReport = mare.views.childListingReport || new mare.views.ChildListingReport();
			mare.views.familyListingReport = mare.views.familyListingReport || new mare.views.FamilyListingReport();
			mare.views.familyStagesReport = mare.views.familyStagesReport || new mare.views.FamilyStagesReport();
            mare.views.caseloadReport = mare.views.caseloadReport || new mare.views.CaseloadReport();
			mare.views.familyActivityReport = mare.views.familyActivityReport || new mare.views.FamilyActivityReport();
		},

		initializeSideNav: function() {

			var view = this;

			// initialize the side nav if it isn't already
			if ( !view.sideNavAPI ) {

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
			if ( this.sideNavAPI.model.state === 'open' ) {
				this.sideNavAPI.view.toggleClose();
			}
		},

		// destroys a table that has been created by a previous view
		destroyTable: function() {
			if ( this.table ) {
				this.table.off( 'column-visibility.dt' );
				this.table.destroy();
				this.table = undefined;
				this.tableColumnVisibility = [];
			}
		},

		// handler for column visibility changed events fired by DataTables in reporting views
		handleColumnVisibilityChanged: function ( event, tableSettings, column, state ) {

			// ensure a column visibility map exists
			mare.views.tools.tableColumnVisibility = mare.views.tools.tableColumnVisibility || [];

			// create column visibility object from event data
			var columnVisibility = { columnIndex: column, visibility: state ? 'visible' : 'hidden' };

			// check for existing column visibility entries for the same column
			var existingColumnVisibility = mare.views.tools.tableColumnVisibility.find( function( existingColVis ) {
				return existingColVis.columnIndex === columnVisibility.columnIndex;
			});

			// if there's already a visibility preference for this column...
			if ( existingColumnVisibility ) {
				
				// update the preference value
				existingColumnVisibility.visibility = columnVisibility.visibility;

			// if no visibility preference exists for this column...
			} else {

				// add new columnVisibility entry
				mare.views.tools.tableColumnVisibility.push( columnVisibility );
			}
		},

		// parses report params (in the form of a query string) and applies any column visibility preferences to the current DataTable
		applyColumnVisibilityFromParams: function( params ) {

			$.each( params[ 'colVis[]' ], function( index, value ) {
							
				// extract column visibility setting from query param
				// format: [ columnIndex, columnVisibility ]
				var columnVisiblitySetting = value.split( '-' );
				
				// show or hide the column based on visibility setting
				// do not immediately redraw the table (deferring until all visibility preferences have been applied)
				mare.views.tools.table.columns( [ columnVisiblitySetting[ 0 ] ] ).visible( columnVisiblitySetting[ 1 ] === 'visible' ? true : false, false );
			});

			// apply all column visibility updates
			mare.views.tools.table.columns.adjust().draw( false );
		},

		// TODO: all the functions below should use a data-attribute instead of a class to specify what's shown
		// TODO: in order to save state in each area, they shouldn't render over eachother, but instead show/hide
		showDashboard: function( fromDate, toDate ) {
			// destroy existing table
			this.destroyTable();
			mare.views.dashboard.render( fromDate, toDate );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__dashboard' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showFamilyMatching: function( familyId, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.familyMatching.render( familyId, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__family-matching' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showChildMatching: function( childId, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.childMatching.render( childId, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__child-matching' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showFamilyMatchingRequest: function() {
			// destroy existing table
			this.destroyTable();
			mare.views.familyMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__family-matching' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},
		
		showChildMatchingRequest: function() {
			// destroy existing table
			this.destroyTable();
			mare.views.childMatchingRequest.render();
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__child-matching' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showInquiryReport: function( fromDate, toDate, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.inquiryReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__inquiry-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		
		},

		showPlacementReport: function( fromDate, toDate, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.placementReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__placement-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showMediaFeaturesReport: function( fromDate, toDate, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.mediaFeaturesReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__media-features-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showChildListingReport: function( regDateFrom, regDateTo, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.childListingReport.render( regDateFrom, regDateTo, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__child-listing-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showFamilyListingReport: function( regDateFrom, regDateTo, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.familyListingReport.render( regDateFrom, regDateTo, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__family-listing-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showFamilyStagesReport: function( params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.familyStagesReport.render( params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__family-stages-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

        showCaseloadReport: function( fromDate, toDate, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.caseloadReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__caseload-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		},

		showFamilyActivityReport: function( fromDate, toDate, params ) {
			// destroy existing table
			this.destroyTable();
			mare.views.familyActivityReport.render( fromDate, toDate, params );
			// update the body class to indicate what screen this is
			this.$el.attr( 'class', 'tools__family-activity-report' );
			// initialize the side nav
			this.initializeSideNav();
			this.closeSideNav();
		}
	});
}());
