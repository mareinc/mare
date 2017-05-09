const keystone		= require( 'keystone' );
const async			= require( 'async' );
const SuccessStory	= keystone.list( 'Success Story' );

exports.getRandomStory = ( req, res, done ) => {

	let locals = res.locals;

	// TODO: Handle the error if we get one
	SuccessStory.model.findRandom( ( err, successStory ) => {
		locals.randomSuccessStory = successStory;
		// execute done function if async is used to continue the flow of execution
		done();
	});

};
