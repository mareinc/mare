(function () {
    'use strict';

    mare.models.Child = Backbone.Model.extend({

        defaults: { },

        initialize: function() {
            console.log('child model initialized');
        }

    });
})();