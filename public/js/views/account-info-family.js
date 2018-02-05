(function () {
	'use strict';

	mare.views.AccountInfoFamily = mare.views.AccountInfoBase.extend({

		childEvents: {
			'change #is-not-ma-city-checkbox' 		: 'toggleCitySelect',
			'change #family-state'					: 'toggleHomestudySubmission',
			'change #homestudy-completed-checkbox'	: 'toggleHomestudySection',
			'change #upload-button'					: 'uploadForm',
			'change #children-in-home'				: 'toggleFamilyDetailsForm'
		},

		initialize: function initialize() {

			// initialize the AccountInfoBaseView that this view inherits from
			mare.views.AccountInfoBase.prototype.initialize.apply( this );

			// create a hook to access the child in home fields template
			var childInHomeHtml = $( '#child-in-home' ).html();
			// compile the template to be used adding/removing child in home field groups
			this.template = Handlebars.compile( childInHomeHtml );

			// DOM cache any commonly used elements to improve performance
			this.$MACityContainer						= this.$( '.city-container' );
			this.$NonMACityContainer					= this.$( '.non-ma-city-container' );
			this.$state									= this.$( '#family-state' );
			this.$homestudySection						= this.$( '.family-submit-your-homestudy-section' );
			this.$homestudySubmissionSection			= this.$( '.family-homestudy-details-section' );
			this.$childrenInHome 						= this.$( '#children-in-home' );
			this.numChildrenInHome						= this.$childrenInHome.val();

			// create and populate form fields for any children that already exist in the family model
			this.setExistingChildData( this.numChildrenInHome );
		},

		toggleCitySelect: function toggleCitySelect( event ) {
				// toggle showing of the MA city dropdown menu
				this.$MACityContainer.toggleClass( 'hidden' );
				// toggle showing of the city free text field
				this.$NonMACityContainer.toggleClass( 'hidden' );
		},

		toggleHomestudySection: function toggleHomestudySection() {
			// hide/show the hidden homestudy section via the hidden class
			this.$homestudySubmissionSection.toggleClass( 'hidden' );
		},

		toggleHomestudySubmission: function toggleHomestudySubmission() {
			var selectedOption	= this.$state.children( 'option:selected' ),
				selectedHTML	= selectedOption.html();

			if( selectedHTML === 'Connecticut' ||
				selectedHTML === 'Massachusetts' ||
				selectedHTML === 'Maine' ||
				selectedHTML === 'New Hampshire' ||
				selectedHTML === 'New York' ||
				selectedHTML === 'Rhode Island' ||
				selectedHTML === 'Vermont' ) {
				// show the homestudy section of the form
				this.$homestudySection.show();
			} else {
				// hide the homestudy section of the form
				this.$homestudySection.hide();
			}
		},

		toggleFamilyDetailsForm: function toggleFamilyDetailsForm() {
			// TODO: this can be done more easily by passing in an event and setting selectedQuantity to event.currentTarget.value
			// capture the number of children the user has selected in the dropdown
			var selectedQuantity = parseInt( this.$childrenInHome.children( 'option:selected' ).html(), 10 );
			var currentChildrenDisplayed = this.$( '.child-details-form' ).length;

			if ( selectedQuantity >= currentChildrenDisplayed ) {
				// show the appropriate number of child forms
				this.generateChildDetailInputs( selectedQuantity );
			} else {

				// remove extra additional child forms
				for( var i = currentChildrenDisplayed; i > selectedQuantity; i-- ) {

					this.accountInfoUpdates[ $( 'input[ name=\'child' + i + '-name\' ]' ).data( 'field-name' ) ] = '_undefined';
					this.accountInfoUpdates[ $( 'input[ name=\'child' + i + '-birthDate\' ]' ).data( 'field-name' ) ] = '_undefined';
					this.accountInfoUpdates[ $( 'select[ name=\'child' + i + '-gender\' ]' ).data( 'field-name' ) ] = '_undefined';
					this.accountInfoUpdates[ $( 'select[ name=\'child' + i + '-type\' ]' ).data( 'field-name' ) ] = '_undefined';
					console.log( this.accountInfoUpdates );

					$( '.child' + i + '-form' ).remove();
					$( '.child' + i + '-form-heading' ).remove(); // TODO: include the heading as part of the form to make cleanup easier
				}
			}
		},

		generateChildDetailInputs: function generateChildDetailInputs( selectedNumberOfChildren ) {
			// count the number of child data groups already shown on the page
			var currentChildrenDisplayed = this.$( '.child-details-form' ).length,
				i;


			// add sections that aren't already on the page
			for( i = currentChildrenDisplayed + 1; i <= selectedNumberOfChildren; i++ ) {
				// pass the relevant data through the child in home template to generate to add to the page
				var html = this.template({ 	index		: i,
											id			: 'child' + i,
											formName	: 'child' + i + '-form',
											formHeading	: 'child' + i + '-form-heading',
											name		: 'child' + i + '-name',
											gender		: 'child' + i + '-gender',
											birthDate	: 'child' + i + '-birthDate',
											type		: 'child' + i + '-type',
											fields		: {
												name		: 'child' + i + '.name',
												gender		: 'child' + i + '.gender',
												birthDate	: 'child' + i + '.birthDate',
												type		: 'child' + i + '.type'
											}});

				this.$( '.children-in-home-details' ).append( html );

			}
		},

		setExistingChildData: function setExistingChildData( numChildren ) {

			this.generateChildDetailInputs( numChildren );

			$( 'span.familyChildrenData > span' ).each( function( index, child ) {

				var childIndex = index + 1;

				$( 'input[ name=\'child' + childIndex + '-name\' ]' ).val( $( child ).find( '.childName' ).text() );
				$( 'input[ name=\'child' + childIndex + '-birthDate\' ]' ).val( $( child ).find( '.childBirthDate' ).text() );

				$( 'select[ name=\'child' + childIndex + '-gender\' ] option[value=\'' + $( child ).find( '.childGender' ).text() + '\'' ).attr( 'selected', 'selected' );
				$( 'select[ name=\'child' + childIndex + '-type\' ] option[value=\'' + $( child ).find( '.childType' ).text() + '\'' ).attr( 'selected', 'selected' );
			});
		},

		uploadForm: function uploadForm( event ) {
			// get the full path to the file and trim everything up to and including the last slash to give us just the file name
			var filepath = event.target.value;
			var filename = filepath.substr( filepath.lastIndexOf( '\\' ) + 1 );
			// show the file name to the user as a point of reference after they've selected the file they wish to upload
			this.$( '.homestudy-file-text' ).html( filename );
		}
	});
}());
