(function () {
	'use strict';

	mare.views.Account = Backbone.View.extend({
		el: 'body',

        events: {
            'click .account-sidebar__section'   : 'navigate',
            'click .account-link--donate'       : 'donate'
        },

		// TODO: consider putting this in a more global space since it's used for button navigation
        navigate: function navigate( event ) {
            var selectedSection = $( event.currentTarget ).data( 'url' );

            mare.routers.account.navigate( selectedSection, { trigger: true } );
        },

        donate: function donate() {
            window.location.href = '/donate';
        },

        openSection: function openSection( section ) {
            var
                currentSectionContainer = this.$( '#account-current-section' ),
                thisSection,
                sectionHTML
            ;

            currentSectionContainer.empty();
            
            switch ( section ) {
                case 'info': thisSection = $( '#account-info' ).html(); break;
                case 'email-list': thisSection = $( '#account-email-list' ).html(); break;
                case 'events': thisSection = $( '#account-events' ).html(); break;
                case 'donations': thisSection = $( '#account-donations' ).html(); break;
                case 'children': thisSection = $( '#account-children' ).html();
            }

            // Compile the template based on section
            this.template = Handlebars.compile( thisSection );

            sectionHTML = this.template();

            currentSectionContainer.append( sectionHTML );
        }
    });
}());
