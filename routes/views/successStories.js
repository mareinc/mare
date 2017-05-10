const keystone 		= require( 'keystone' );
const async			= require( 'async' );
const _				= require( 'underscore' );
const SuccessStory	= keystone.list( 'Success Story' );
const Utils			= require( '../middleware/utilities' );
const pageService	= require( '../middleware/service_page' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res );
    const locals 	= res.locals;

	let WYSIWYGModificationOptions = [{
		action: 'add classes',
		element: 'p',
		classesToAdd: 'card-details__paragraph',
		targetAll: true
	}, {
		action: 'add more links',
		element: 'p',
		targetAll: false,
		targetsArray: [ 0 ]
	}];

	async.parallel([
		done => { // TODO: Pull this function into the success story service
			SuccessStory.model.find()
				.exec()
				.then( successStories => {
					// An array to hold all success stories
					locals.stories = [];

					var truncateOptions = {
						targetLength: 400
					}

					// Loop through all success stories
					_.each( successStories, successStory => {
						successStory.shortContent = Utils.truncateText( successStory.content, truncateOptions );
						// append classes to the WYSIWYG generated content to allow for styling
						Utils.modifyWYSIWYGContent( successStory, 'shortContent', WYSIWYGModificationOptions );
						// Store all success stories in an array on locals to expose them during templating
						locals.stories.push( successStory );
					});

					done();

				});
		},
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'success-stories' );

	});
};
