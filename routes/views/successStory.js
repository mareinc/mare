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

	/* TODO: Add error handling so the page doesn't hang if we can't find the event */
	async.parallel([
		done => { // TODO: Pull this function into the success story service
			SuccessStory.model.findOne()
		    	.where( 'url', req.originalUrl )
				.exec()
				.then( successStory => {
					// modify the WYSIWYG generated content to allow for styling
					Utils.modifyWYSIWYGContent( successStory, 'content', WYSIWYGModificationOptions );
					// Find the target story for the current page and store the object in locals for access during templating
					locals.story = successStory;

					done();
				});
		},
		done => { pageService.populateSidebar( req, res, done ); }
	], () => {
		// Set the layout to render with the right sidebar
		locals[ 'render-with-sidebar' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'success-story' );
	});

};
