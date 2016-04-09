var keystone		= require('keystone'),
	Event			= keystone.list('Event');

exports.getEventByUrl = function getEventByUrl(req, res, done, url) {

	req.locals = res.locals || {};
	var locals = res.locals;



	Event.model.findById(url)
				.exec()
				.then(function (targetEvent) {

					locals.targetEvent = targetEvent[0];
					// execute done function if async is used to continue the flow of execution
					done();

				}, function(err) {

					console.log(err);
					done();

				});
}