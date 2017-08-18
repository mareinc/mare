(function () {
	'use strict';

	mare.views.Account = Backbone.View.extend({
		el: 'body',

		initialize: function initialize() {
			// initialize the views for the sidebar and mobile menu
			mare.views.accountMobileSidebar	= mare.views.accountMobileSidebar || new mare.views.AccountMobileSidebar();
			mare.views.accountSidebar 		= mare.views.accountSidebar || new mare.views.AccountSidebar();
			
			// initialize views for the different account sections
			mare.views.accountInfo		= mare.views.accountInfo || new mare.views.AccountInfo();
			mare.views.accountChildren	= mare.views.accountChildren || new mare.views.AccountChildren();
			mare.views.accountEmailList	= mare.views.accountEmailList || new mare.views.AccountEmailList();
			mare.views.accountEvents	= mare.views.accountEvents || new mare.views.AccountEvents();

			// render the page navigation elements
			this.renderNavigation();

			// bind listeners for navigation changes
			mare.views.accountMobileSidebar.on( 'changeSection', this.changeSection.bind( this ) );
			mare.views.accountSidebar.on( 'changeSection', this.changeSection.bind( this ) );
		},

		changeSection: function changeSection( section ) {
			// trigger an event so the router knows to update the route
			this.trigger( 'changeRoute', section );
		},

		renderNavigation: function renderNavigation( section ) {
			// render the sidebar and mobile dropdown
			mare.views.accountMobileSidebar.render( section );
			mare.views.accountSidebar.render(  section );
		},

		openInfoSection: function openInfoSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'info' );
			// hide the account subsections that are not currently selected
			mare.views.accountChildren.hide();
			mare.views.accountEmailList.hide();
			mare.views.accountEvents.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountInfo.show();
			mare.views.accountInfo.render();
		},

		openChildrenSection: function openChildrenSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'children' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountEmailList.hide();
			mare.views.accountEvents.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountChildren.show();
			mare.views.accountChildren.render();
		},

		openEmailListSection: function openEmailListSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'email-list' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountChildren.hide();
			mare.views.accountEvents.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountEmailList.show();
			mare.views.accountEmailList.render();		
		},

		openEventsSection: function openEventsSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'events' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountChildren.hide();
			mare.views.accountEmailList.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountEvents.show();
			mare.views.accountEvents.render();
		}
	});
}());
