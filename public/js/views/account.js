(function () {
	'use strict';

	mare.views.Account = Backbone.View.extend({
		el: 'body',

		initialize: function initialize() {
			// initialize the views for the sidebar and mobile menu
			mare.views.accountMobileSidebar	= mare.views.accountMobileSidebar || new mare.views.AccountMobileSidebar();
			mare.views.accountSidebar 		= mare.views.accountSidebar || new mare.views.AccountSidebar();

			// initialize views for the different account sections
			mare.views.accountChildren	= mare.views.accountChildren || new mare.views.AccountChildren();
			mare.views.accountEmailList	= mare.views.accountEmailList || new mare.views.AccountEmailList();
			mare.views.accountEvents	= mare.views.accountEvents || new mare.views.AccountEvents();
            mare.views.accountInquiries = mare.views.accountInquiries || new mare.views.AccountInquiries();
			mare.views.accountRegistrationLinks = mare.views.accountRegistrationLinks || new mare.views.AccountRegistrationLinks();

			this.initializeInfoSection();

			// render the page navigation elements
			this.renderNavigation();

			// bind listeners for navigation changes
			mare.views.accountMobileSidebar.on( 'changeSection', this.changeSection.bind( this ) );
			mare.views.accountSidebar.on( 'changeSection', this.changeSection.bind( this ) );

			// create a flag to denote if the child section has been rendered
			this.hasChildSectionRendered = false;
		},

		changeSection: function changeSection( section ) {
			// trigger an event so the router knows to update the route
			this.trigger( 'changeRoute', section );
		},

		renderNavigation: function renderNavigation( section ) {
			// render the sidebar and mobile dropdown
			mare.views.accountMobileSidebar.render( section );
			mare.views.accountSidebar.render( section );
		},

		initializeInfoSection: function initializeInfoSection( ) {

			// check to ensure an account info view doesn't already exist
			if ( !mare.views.accountInfo ) {

				// get the type of info section currently loaded
				var infoSectionType = $( '#currentSection' ).data( 'info-section-type' );

				// initialize the proper Account Info view based on the current user type
				switch ( infoSectionType ) {
					case 'admin':
						mare.views.accountInfo = new mare.views.AccountInfoBase();
						break;
					case 'family':
						mare.views.accountInfo = new mare.views.AccountInfoFamily();
						break;
					case 'social worker':
						mare.views.accountInfo = new mare.views.AccountInfoSocialWorker();
						break;
					case 'site visitor':
						mare.views.accountInfo = new mare.views.AccountInfoSiteVisitor();
						break;
					default:
						console.error( 'no account info view DOM present - cannot initialize account info backbone view' );
				}
			}
		},

		openInfoSection: function openInfoSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'info' );
			// hide the account subsections that are not currently selected
			mare.views.accountChildren.hide();
			mare.views.accountEmailList.hide();
			mare.views.accountEvents.hide();
            mare.views.accountInquiries.hide();
			mare.views.accountRegistrationLinks.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountInfo.show();
		},

		openChildrenSection: function openChildrenSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'children' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountEmailList.hide();
			mare.views.accountEvents.hide();
            mare.views.accountInquiries.hide();
			mare.views.accountRegistrationLinks.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountChildren.show();

			// if the child section hasn't rendered yet
			if ( !this.hasChildSectionRendered )  {
				// render the child section
				mare.views.accountChildren.render();
				// update the rendered flag
				this.hasChildSectionRendered = true;
			}
		},

		openEmailListSection: function openEmailListSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'email-list' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountChildren.hide();
			mare.views.accountEvents.hide();
            mare.views.accountInquiries.hide();
			mare.views.accountRegistrationLinks.hide();
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
            mare.views.accountInquiries.hide();
			mare.views.accountRegistrationLinks.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountEvents.show();
			mare.views.accountEvents.render();
		},

        openInquiriesSection: function openInquiriesSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'inquiries' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountChildren.hide();
			mare.views.accountEvents.hide();
            mare.views.accountEmailList.hide();
			mare.views.accountRegistrationLinks.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountInquiries.show();
			mare.views.accountInquiries.render();
		},

		openRegistrationLinkSection: function openRegistrationLinkSection() {
			// update the navigation sections with the currently selected section
			this.renderNavigation( 'registration-links' );
			// hide the account subsections that are not currently selected
			mare.views.accountInfo.hide();
			mare.views.accountChildren.hide();
			mare.views.accountEvents.hide();
            mare.views.accountEmailList.hide();
			mare.views.accountInquiries.hide();
			// show the account subsection that is currently selected, and render it
			mare.views.accountRegistrationLinks.show();
			mare.views.accountRegistrationLinks.render();
		}
	});
}());
