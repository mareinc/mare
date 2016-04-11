(function () {
    'use strict';

    mare.collections.Children = Backbone.Collection.extend({

    	model: mare.models.Child,

        initialize: function() {
        	console.log('child collection initialized');
        }

    });
})();