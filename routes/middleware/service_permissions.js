/* TODO: this should be moved to service_user.js */
var keystone	= require('keystone'),
	_			= require('underscore'),
	async		= require('async'),
	User		= keystone.list('User');

exports.getGalleryPermissions = function getGalleryPermissions(req, res, next) {

	let locals = res.locals;

	// set local variables
	locals.userType	= req.user ? req.user.get('userType') : 'anonymous';
	// set a control variable for what a user has access to and simplifying future checks
	locals.canBookmark	= locals.userType === 'family' || locals.userType === 'social worker';
	locals.canSearch	= locals.userType === 'family' || locals.userType === 'social worker' || locals.userType === 'admin';

	// set the permissions object and return it to the user
	locals.galleryPermissions = {
		canBookmark	: locals.canBookmark,
		canSearch	: locals.canSearch
	}

	res.send(locals.galleryPermissions);

};