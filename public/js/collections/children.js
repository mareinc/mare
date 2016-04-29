(function () {
    'use strict';

    mare.collections.Children = Backbone.Collection.extend({

    	model: mare.models.Child,

    	initialize: function initialize() {
    		this.sortByDateAdded(); // Set the default comparator on the collection to order by how recently the child was registered
    	},

		reorder: function reorder(sortBy) {

			switch(sortBy) {
				case 'date-added'	: this.sortByDateAdded(); break;
				case 'name'			: this.sortByName(); break;
				case 'age'			: this.sortByAge(); break;
				default				: this.sortByDateAdded(); break;
			}

		},

		sortByDateAdded: function sortByDateAdded() {

			this.comparator = function comparator(child) {
				return -child.get('registrationDateConverted');
			}

			this.sort();

		},

		sortByName: function sortByName() {

			this.comparator = 'name';
			this.sort();

		},

		sortByAge: function sortByAge() {

			this.comparator = 'age';
			this.sort();

		}

    });
})();