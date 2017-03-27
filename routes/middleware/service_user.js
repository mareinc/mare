var keystone		= require('keystone'),
	User			= keystone.list('User'),
	Admin			= keystone.list('Admin'),
	SiteVisitor		= keystone.list('Site Visitor'),
	SocialWorker	= keystone.list('Social Worker'),
	Family			= keystone.list('Family');

/* Root through the passed in options and get/set the necessary information on res.locals for processing by each service request */
exports.exposeGlobalOptions = function exposeGlobalOptions(req, res, options) {

	res.locals.targetModel = exports.getTargetModel(req, res, options.userType);

};
/* We're using one generic function to capture data for all user types.  This requires a user to pass in a userType
   in an options object in order to fetch anything but base Users */
exports.getTargetModel = function getTargetModel(req, res, userType) {

	var targetModel;

	switch(userType) {
		case 'User'				: targetModel = User; break;
		case 'Admin'			: targetModel = Admin; break;
		case 'Site Visitor'		: targetModel = SiteVisitor; break;
		case 'Social Worker'	: targetModel = SocialWorker; break;
		case 'Family'			: targetModel = Family; break;
		default					: targetModel = User;
	}

	return targetModel;

};

/* Get a user of any type by their _id value in the database */
exports.getUserById = function getUserById(req, res, done, options) {
	// Several options need to be available in callback functions, expose them globally via res.locals
	exports.exposeGlobalOptions(req, res, options);

	var locals		= res.locals,
		targetModel = res.locals.targetModel;

	targetModel.model.findById(options.id)
				.exec()
				.then(function (user) {

					locals.user = user;
					// execute done function if async is used to continue the flow of execution
					// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
					done();

				}, function(err) {

					console.log(err);
					done();

				});
};

exports.checkUserActiveStatus = function( email, locals, done ) {
	
	User.model.findOne()
		.where( 'email', email )
		.exec()
		.then( user => {
			// if a user with the current email doesn't exist
			if( !user ) {
				// exit the login process and let the user know their email or password is invalid
				locals.userStatus = 'nonexistent';
			// if the user exists but isn't active yet
			} else if( user.isActive === false ) {
				// exit the login process and let the user know their account isn't active yet
				locals.userStatus = 'inactive';
			// if the user exists and is active
			} else {
				// let the system attempt to log the user in
				locals.userStatus = 'active';
			}

			done();

		}, err => {

			console.log( err );
			done();
		});
}