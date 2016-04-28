var keystone	= require('keystone'),
	_			= require('underscore'),
	async		= require('async'),
	middleware	= require('./middleware'),
	Child		= keystone.list('Child');

exports.getAllChildren = function getAllChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.populate('gender')
				.populate('status')
				.populate('legalStatus')
				.exec()
				.then(function (children) {
					// Filter out all children who don't have a status of 'active'
					children = _.filter(children, function(child) {
						return child.status.childStatus === 'active'
					});

					_.each(children, function(child) {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage(req, res, child);
						// set extra information needed for rendering the child to the page
						child.age						= middleware.getAge(child.birthDate);
			    		child.ageConverted				= middleware.convertDate(child.birthDate);
			    		child.registrationDateConverted	= middleware.convertDate(child.registrationDate);
					});

					locals.children = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});
};

exports.getUnrestrictedChildren = function getUnrestrictedChildren(req, res, done) {

	var locals = res.locals;

	Child.model.find()
				.where('siteVisibility', 'everyone')
				.populate('gender')
				.populate('status')
				.populate('legalStatus')
				.exec()
				.then(function (children) {
					// Filter out all children who don't have a status of 'active'
					children = _.filter(children, function(child) {
						return child.status.childStatus === 'active'
					});

					_.each(children, function(child) {
						// adjust the image to the blank male/female image if needed
						exports.setNoChildImage(req, res, child);
						// set extra information needed for rendering the child to the page
						child.age						= middleware.getAge(child.birthDate);
			    		child.ageConverted				= middleware.convertDate(child.birthDate);
			    		child.registrationDateConverted	= middleware.convertDate(child.registrationDate);
					});

					locals.children = children;
					// execute done function if async is used to continue the flow of execution
					done()

				}, function(err) {

					console.log(err);
					// execute done function if async is used to continue the flow of execution
					done();

				});
};

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
};

exports.getChildByRegistrationNumber = function getChildByRegistrationNumber(req, res, done, registrationNumber) {

	var locals				= res.locals,
		registrationNumber	= parseInt(registrationNumber);

		Child.model.find()
				.where('registrationNumber', registrationNumber)
				.exec()
				.then(function (child) {

					locals.child = child[0];
					// execute done function if async is used to continue the flow of execution
	 				// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
					done();

				}, function(err) {

					console.log(err);
					done();

				});

};

/* Expose the child data for the gallery view to the front-end via an API call */
exports.getGalleryData = function getGalleryData(req, res, next) {

	var locals = res.locals;
	// Set local variables
	locals.publicChildrenData = [];
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';
	locals.targetChildren = locals.userType === 'anonymous' || locals.userType === 'site visitor' ? 'unrestricted' : 'all';


	async.series([
		function(done) {

			if(locals.targetChildren === 'all') {
				exports.getAllChildren(req, res, done);
			} else {
				exports.getUnrestrictedChildren(req, res, done);
			}

		}

	], function() {
		// Full child records have been fetched and stored on res.locals
		_.each(locals.children, function(child) {

			var relevantData = {
	    		name						: child.name.first,
	    		age							: middleware.getAge(child.birthDate),
	    		legalStatus					: child.legalStatus.legalStatus,
	    		ageConverted				: middleware.convertDate(child.birthDate),
	    		registrationDateConverted	: middleware.convertDate(child.registrationDate),
	    		registrationNumber			: child.registrationNumber,
	    		galleryImage				: child.galleryImage,
	    		hasVideo					: child.video && child.video.length > 0,
	    		wednesdaysChild				: child.wednesdaysChild
	    	};

	    	locals.publicChildrenData.push(relevantData);

		});

		res.send(locals.publicChildrenData);

	});
};

// TODO: include an error message for this and other functions in middleware if applicable
exports.getChildDetails = function(req, res, next) {

	var childData = req.body,
		registrationNumber = childData['registrationNumber'];

	/* TODO: Fetch only the needed fields instead of grabbing everything */
	Child.model.find()
        .where('registrationNumber', registrationNumber)
        .populate('gender')
        .exec()
        .then(function (child) {

        	var child = child[0];

        	var relevantData = {
        		profilePart1		: child.profile.part1,
        		profilePart2		: child.profile.part2,
        		profilePart3		: child.profile.part3,
        		detailImage			: child.detailImage,
        		hasImage			: _.isEmpty(child.image) && child.image.url.length > 0,
        		video				: child.video && child.video.length > 0 ? child.video.replace('watch?v=', 'embed/') : undefined,
        	};

        	res.send(relevantData);
        });
};