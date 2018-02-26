(function () {
    'use strict';

    mare.collections.SiblingGroups = Backbone.Collection.extend({

    	model: mare.models.SiblingGroup,

    	initialize: function initialize() {
			// set the default comparator on the collection to order by how recently the child was registered
    		this.sortByDateRegistered();
    	},
		// TODO: update based on Lisa's input
		reorder: function reorder( sortBy ) {

			switch( sortBy ) {
				case 'registered'	: this.sortByDateRegistered(); break;
				case 'name'			: this.sortByName(); break;
				case 'age'			: this.sortByAge(); break;
				default				: this.sortByDateRegistered(); break;
			}

		},

		sortByDateRegistered: function sortByDateRegistered() {

			this.comparator = function comparator( siblingGroup ) {
				// find the largest number of milliseconds ( most recently updated ) and sort in reverse order
				return _.max( siblingGroup.get( 'registrationDatesConverted' ) );
			}

			this.sort();

		},
		// TODO: make names alphabetical
		sortByName: function sortByName() {

			this.comparator = function comparator( siblingGroup ) {
				// the names are already alphabetical, but sort them to be sure, and grab the first name in the array
				return _.sortBy( siblingGroup.get( 'names' ) );
			}

			this.sort();

		},

		sortByAge: function sortByAge() {

			this.comparator = function comparator( siblingGroup ) {
				// find the minimum age in the array
				// TODO: this should compare one age after the next, but comparing arrays by replacing _.min with _.sortBy was causing issues where 10 < 2, etc.
				return _.min( siblingGroup.get( 'ages' ) );
			}

			this.sort();

		}
    });
}());
