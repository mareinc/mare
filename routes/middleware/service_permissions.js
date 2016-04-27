var keystone	= require('keystone'),
	_			= require('underscore'),
	async		= require('async'),
	User		= keystone.list('User');

exports.getGalleryPermissions = function getGalleryPermissions(req, res, next) {

	req.locals = res.locals || {};
	var locals = res.locals;

	// Set local variables
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';
	// Set a control variable for what a user has access to and simplifying future checks
	locals.canBookmark	= locals.userType === 'family' || locals.userType === 'social worker' ? true : false;
	locals.canSearch	= locals.userType === 'family' || locals.userType === 'social worker' || locals.userType === 'admin' ? true : false;

	// Set the permissions object and return it to the user
	locals.galleryPermissions = {
		canBookmark	: locals.canBookmark,
		canSearch	: locals.canSearch
	}

	res.send(locals.galleryPermissions);

};