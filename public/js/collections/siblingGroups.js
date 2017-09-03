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

			switch(sortBy) {
				case 'registered'	: this.sortByDateRegistered(); break;
				case 'name'			: this.sortByName(); break;
				case 'age'			: this.sortByAge(); break;
				default				: this.sortByDateRegistered(); break;
			}

			this.trigger( 'sorted' );

		},
		// TODO: update based on Lisa's input
		sortByDateRegistered: function sortByDateRegistered() {

			this.comparator = function comparator( child ) {
				return -child.get( 'registrationDateConverted' );
			}

			this.sort();

		},
		// TODO: update based on Lisa's input
		sortByName: function sortByName() {

			this.comparator = 'name';
			this.sort();

		},
		// TODO: update based on Lisa's input
		sortByAge: function sortByAge() {

			this.comparator = 'age';
			this.sort();

		}
    });
}());
