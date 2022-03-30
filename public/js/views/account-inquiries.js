(function () {
	'use strict';

	mare.views.AccountInquiries = Backbone.View.extend({

        el: '.account-inquiries-container',

        events: {
		    'input .inquiry__note': 'onNotesUpdated',
            'click .inquiry__save': 'onSaveButtonClicked'
		},

		initialize: function initialize() {
			// create a hook to access the section templates
			var html = $( '#account-inquiries' ).html();
			// compile the templates to be used during rendering/repainting the different sections
			this.template = Handlebars.compile( html );
		},

		render: function render() {
			// compile the template
			var html = this.template();
			// render the template to the page
			this.$el.html( html );
            // remove erroneous tab characters that are inserted into note textareas
            $( '.inquiry__note' ).each( function( index, el ) {
                var $notesTextArea = $( el );
                var filteredText = $notesTextArea.val().replace( /\t+/g, '' );
                $notesTextArea.val( filteredText );
                $notesTextArea.data( 'initialNote', filteredText );
            });
		},

		hide: function hide() {
			// hide the section
			this.$el.hide();
			// remove the contents of the view
			this.$el.empty();
			// NOTE: if any events are bound to DOM elements, they should be explicitly removed here as well
		},

		show: function show() {
			this.$el.show();
		},

        onNotesUpdated: function onNotesUpdated( event ) {
            
            // get the notes textarea
            var $notesInput = $( event.currentTarget );
            // get the initial note data
            var initialNote = $notesInput.data( 'initialNote' );
            // get the current note data
            var currentNote = $notesInput.val();
            // get the save button
            var $saveButton = $( '#save-btn-' + $notesInput.data( 'index' ) );
            // enable/disable the save button
            $saveButton.attr( 'disabled', initialNote === currentNote );
            $saveButton.toggleClass( 'button--disabled', initialNote === currentNote );
            // save the note data to the save button to make AJAX submission easier
            $saveButton.data( 'note', currentNote );
        },

        onSaveButtonClicked: function onSaveButtonClicked( event ) {

            // get the save button
            var $saveButton = $( event.currentTarget );
            
            $.ajax({
				url: '/account/inquiry-note',
				type: 'PUT',
                data: {
                    id: $saveButton.data( 'id' ),
                    notes: $saveButton.data( 'note' )
                }
			}).done( function( response ) {
                console.log(response);
			}).fail( function( err ) {
				// TODO: show an error message if we failed to save the note
				console.log( err );
			});
        }
	});
}());
