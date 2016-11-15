var keystone		= require( 'keystone' ),
	async			= require( 'async' ),
	User			= keystone.list( 'User' ),
	Family			= keystone.list( 'Family' ),
	Child			= keystone.list( 'Child' ),
	childService	= require( './service_child' ),
	userService		= require( './service_user' );

exports.setGalleryPermissions = ( req, res, done ) => {

	let locals		= res.locals;

	const userType	= locals.userType;

	locals.canBookmarkChildren = userType === 'social worker' || userType === 'family' ? true : false;
	locals.canSearchForChildren = userType === 'social worker' || userType === 'family' ? true : false;

	done();
};

/* If the user type is capable of bookmarking children on the site, retrieve any that are already bookmarked */
exports.getBookmarkedChildren = ( req, res, done ) => {

	let locals = res.locals;

	// Fetch the user if it has already been retrieved
	if( locals.user === undefined ) {

		const userId = req.user.get( '_id' );

		async.series([
			done => { userService.getUserById( req, res, done, userId ); }
		], () => {
			// store all the bookmarked children and add all the bookmarked siblings
			locals.bookmarkedChildren = locals.user.get( 'bookmarkedChildren' );
			local.bookmarkedChildren.push( ...locals.user.get( 'bookmarkedSiblings' ) );
			// execute done function if async is used to continue the flow of execution
			// TODO: if this is used in non-async middleware, done or next should be passed into options and the appropriate one should be executed
			done();

		});

	} else {

		locals.bookmarkedChildren = locals.user.get( 'bookmarkedChildren' );
		locals.bookmarkedChildren.push( ...locals.user.get( 'bookmarkedSiblings' ) );

		done();
	}
};

/*
 *	Frontend services
 */
exports.addChildBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get('_id');
	const registrationNumber	= req.body.registrationNumber;

	async.parallel([
		done => { childService.getChildByRegistrationNumber( req, res, done, registrationNumber ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childId				= locals.child.get( '_id' );
		const bookmarkedChildren	= locals.user.get( 'bookmarkedChildren' );
		// Only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if( bookmarkedChildren.indexOf( childId ) === -1 ) {
			bookmarkedChildren.push( childId );
		}

		locals.user.update( { bookmarkedChildren: bookmarkedChildren }, { multi: false }, ( err, raw ) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark added' );

		});
	});
};

exports.removeChildBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumber	= req.body.registrationNumber;

	async.parallel([
		done => { childService.getChildByRegistrationNumber( req, res, done, registrationNumber ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childId				= locals.child.get( '_id' );
		const bookmarkedChildren	= locals.user.get( 'bookmarkedChildren' );
		const bookmarkIndex			= bookmarkedChildren.indexOf( childId );
		// Only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system,
		// but the check has been added for an extra layer of safety
		if( bookmarkedChildren.indexOf( childId ) !== -1 ) {
			bookmarkedChildren.splice( bookmarkIndex, 1 );
		}

		locals.user.update( { bookmarkedChildren: bookmarkedChildren }, { multi: false }, (err, raw) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark removed' );

		});
	});
};

exports.addSiblingGroupBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumbers	= req.body.registrationNumbers.split( ',' );

	async.parallel([
		done => { childService.getChildrenByRegistrationNumbers( req, res, done, registrationNumbers ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childIds				= locals.children.map( child => child.get( '_id' ).toString() );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		// Only add the bookmark if it hasn't already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
		for ( childId of childIds ) {
			if( bookmarkedSiblings.indexOf( childId ) === -1 ) {
				bookmarkedSiblings.push( childId );
			}
		}

		locals.user.update( { bookmarkedSiblings: bookmarkedSiblings }, { multi: false }, ( err, raw ) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark added' );

		});
	});
}

exports.removeSiblingGroupBookmark = ( req, res, next ) => {

	let locals					= res.locals;

	const userId				= req.user.get( '_id' );
	const registrationNumbers	= req.body.registrationNumbers.split( ',' );

	async.parallel([
		done => { childService.getChildrenByRegistrationNumbers( req, res, done, registrationNumbers ); },
		done => { userService.getUserById( req, res, done, userId ); }
	], () => {

		const childIds				= locals.children.map( child => child.get( '_id' ).toString() );
		const bookmarkedSiblings	= locals.user.get( 'bookmarkedSiblings' );

		for( childId of childIds ) {
			const bookmarkIndex = bookmarkedSiblings.indexOf( childId );
			// Only remove the bookmark if it has already been saved.  This is unlikely, and would require a bad state in the system, but the check has been added for an extra layer of safety
			if( bookmarkedSiblings.indexOf( childId ) !== -1 ) {
				bookmarkedSiblings.splice( bookmarkIndex, 1 );
			}
		}

		locals.user.update( { bookmarkedSiblings: bookmarkedSiblings }, { multi: false }, (err, raw) => {
			if ( err ) {
				console.log( err );
			}

			res.send( 'bookmark removed' );

		});
	});
}
