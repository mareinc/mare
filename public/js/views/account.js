(function () {
	'use strict';

	mare.views.Account = Backbone.View.extend({
		el: 'body',

        events: {
            'change .mobile-account-nav'    : 'dropdownNavigation'
        },

        openSection: function openSection( section ) {
            var
                currentSectionContainer = this.$( '#account-current-section' ),
                thisSection
            ;

            // TODO: Set currentSection and pass in to template
            this.currentSection = mare.url.route;
            // TODO: Set currentSection and pass in to template

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
            currentSectionContainer.html( this.template() );
        },

        dropdownNavigation: function dropdownNavigation( e ) {
            window.location.href = e.currentTarget.value;
        }
    });
}());
