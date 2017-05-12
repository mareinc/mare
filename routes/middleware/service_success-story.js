const keystone		= require( 'keystone' );
const async			= require( 'async' );
const SuccessStory	= keystone.list( 'Success Story' );
const Utils			= require( './utilities' );

exports.getRandomStory = ( req, res, done ) => {

	let locals = res.locals;

	// TODO: Handle the error if we get one
	SuccessStory.model.findRandom( ( err, successStory ) => {
		// NOTE: if this needs to be used for more than just the sidebar, we may need to relocate the call or create additional truncated text variants
		// set how the text will be truncated for short content displays
		const truncateOptions = { targetLength: 200 }
		// create a truncated content element for a nicer display in summary cards
		successStory.shortContent = Utils.truncateText( successStory.content, truncateOptions );

		locals.randomSuccessStory = successStory;
		// execute done function if async is used to continue the flow of execution
		done();
	});

};
