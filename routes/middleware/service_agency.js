 const keystone	= require( 'keystone' );

exports.getAgencyById = id => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// return control to the calling context
			return reject( `error fetching agency by id - no id value passed in` );
		}
		// fetch the agency record
		keystone.list( 'Agency' ).model
			.findById( id )
			.exec()
			.then( agency => {
				// if no agency was found with a matching id
				if( !agency ) {
					// reject the promise with the reason why
					reject( `error fetching agency by id - no agency found with id ${ id }`)
				}
				// resolve the promise with the returned agency
				resolve( agency );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching agency by id ${ id } - ${ err }` );
			});
	});
};

/* Chron job function used to batch save all agency models */
exports.saveAllAgencies = () => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Agency' ).model
			.find()
			.then( async agencies => {
				// create an array of errors to display once all models have been saved
				let errors = [];
				// loop through each agency
				for( let [ index, agency ] of agencies.entries() ) {

					if( index % 100 === 0 ) {
						console.log( `saving agency ${ index } of ${ agencies.length }` );
					}

					try {
						await agency.save();
					}
					catch( e ) {
						errors.push( `chron: error saving agency ${ agency.code } - ${ e }` );
					}
				};
				// log each of the errors to the console
				for( let error of errors ) {
					console.error( error );
				}

				resolve();

			}, err => {

				console.error( `chron: error fetching agencies for nightly chron job - ${ err }` );
				reject();
			});	
	});
};