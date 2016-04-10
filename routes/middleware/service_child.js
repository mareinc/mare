var keystone	= require('keystone'),
	_			= require('underscore'),
	Child		= keystone.list('Child');

exports.getAllChildren = function getAllChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.populate('gender')
				.populate('legalStatus')
				.exec()
				.then(function (children) {

					locals.children = children;
					_.each(children, function(child) {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage(req, res, child);
					});
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});
}

exports.getUnrestrictedChildren = function getUnrestrictedChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.where('siteVisibility', 'everyone')
				.populate('gender')
				.populate('legalStatus')
				.exec()
				.then(function (children) {

					locals.children = children;

					_.each(children, function(child) {
						// adjust the image to the blank male/female image if needed
						exports.setChildImage(req, res, child);
					});
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});

}

/* Sets the images for display in the gallery to a blank male/female face in the following cases:
 *	1. No image was uploaded for the child
 *	2. The child has been identified as legal risk
 */
exports.setNoChildImage = function setNoChildImage(req, res, child) {
	// Constant definitions.  TODO: Change these to const instead of var once support for ES2015 improves
	var NO_IMAGE_MALE_GALLERY = 'images/no-image-male_gallery.png',
		NO_IMAGE_MALE_DETAILS = 'images/no-image-male_detail.png',
		NO_IMAGE_FEMALE_GALLERY = 'images/no-image-female_gallery.png',
		NO_IMAGE_FEMALE_DETAILS = 'images/no-image-female_detail.png';
	// If there's no image or if the child has been identified as legal risk set the correct picture for males/females
	if(child.image.url === undefined || child.legalStatus.legalStatus === 'legal risk') {

		if(child.gender.gender === 'male') {

			child.detailImage = NO_IMAGE_MALE_DETAILS;
			child.galleryImage = NO_IMAGE_MALE_GALLERY;

		} else if(child.gender.gender === 'female') {

			child.detailImage = NO_IMAGE_FEMALE_DETAILS;
			child.galleryImage = NO_IMAGE_FEMALE_GALLERY;

		}
	}

}