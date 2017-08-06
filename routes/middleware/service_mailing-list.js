const keystone		= require( 'keystone' ),
	  MailingList	= keystone.list( 'Mailing List' );

exports.getRegistrationMailingLists = ( req, res, done ) => {

	var locals = res.locals;

	MailingList.model
		.find( { $or: [
					{ 'showOnSiteVisitorRegistrationPage': true },
					{ 'showOnSocialWorkerRegistrationPage': true },
					{ 'showOnFamilyRegistrationPage': true } ] } )
		// .select( ' ' )
		.exec()
		.then( mailingLists => {
			// store the returned mailing lists on locals for templating
			locals.mailingLists = mailingLists;
			// execute done function if async is used to continue the flow of execution
			done()

		}, err => {

			console.log( err );
			done();

		});
};
