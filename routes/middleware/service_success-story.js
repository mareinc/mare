var keystone		= require('keystone'),
	async			= require('async'),
	SuccessStory	= keystone.list('Success Story');

	exports.getRandomStory = function getRandomStory(req, res, done) {

		let locals = res.locals;

		// TODO: Handle the error if we get one
		SuccessStory.model.findRandom(function(err, successStory){
			locals.randomSuccessStory = successStory;
			// execute done function if async is used to continue the flow of execution
			done();
		});

	};
