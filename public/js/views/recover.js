(function () {
	'use strict';

	mare.views.Recover = Backbone.View.extend({
		el: '#password-change-form',

		initialize: function() {
			// initialize parsley validation on the form
			this.form = this.$el.parsley();
		}

	});
}());