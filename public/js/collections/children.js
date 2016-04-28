(function () {
    'use strict';

    mare.collections.Children = Backbone.Collection.extend({

    	model: mare.models.Child,
    	// Set the comparator on the collection to order by how recently the child was registered
		// comparator: 'registrationDateConverted'

		comparator: function(child) {
			return -child.get('registrationDateConverted');
		}

    });
})();