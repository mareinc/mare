(function () {
	'use strict';

	mare.views.SiteVisitorRegistration = Backbone.View.extend({
		el: '.site-visitor-registration',

		events: {
			'change .other-way-to-hear-about-mare': 'toggleOtherWayToHearTextField'
		},

		initialize: function() {
			// DOM cache any commonly used elements to improve performance
			this.$howDidYouHearOther = this.$('#site-visitor-how-did-you-hear-other');
		},

		toggleOtherWayToHearTextField: function toggleOtherWayToHearTextField() {
			this.$howDidYouHearOther.toggleClass('hidden');
		}

	});
})();