const keystone = require( 'keystone' );

exports.runNightlyChronJob = async ( req, res, next ) => {

	console.log( `execution of the nightly chron job has started` );

	await saveAllAgencies();
	await saveAllSocialWorkers();
	await saveAllChildren();

	res.status(200).send();

	console.log( `execution of the nightly chron job complete` );

	next();
}

/*
 * private functions
 */

// TODO: can the below three functions be combined into a single generic function?
function saveAllAgencies() {

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

function saveAllSocialWorkers() {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Social Worker' ).model
			.find()
			.then( async socialWorkers => {
				// create an array of errors to display once all models have been saved
				let errors = [];
				// loop through each social worker
				for( let [ index, socialWorker ] of socialWorkers.entries() ) {

					if( index % 100 === 0 ) {
						console.log( `saving social worker ${ index } of ${ socialWorkers.length }` );
					}

					try {
						await socialWorker.save();
					}
					catch( e ) {
						errors.push( `chron: error saving social worker ${ socialWorker.name.full } - ${ socialWorker._id } - ${ e }` );
					}
				};
				// log each of the errors to the console
				for( let error of errors ) {
					console.error( error );
				}

				resolve();

			}, err => {

				console.error( `error fetching social workers for nightly chron job - ${ err }` );
				reject();
			});	
		
	});
};

function saveAllChildren() {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Child' ).model
			.find()
			.then( async children => {
				// create an array of errors to display once all models have been saved
				let errors = [];
				// loop through each child
				for( let [ index, child ] of children.entries() ) {

					if( index % 100 === 0 ) {
						console.log( `saving child ${ index } of ${ children.length }` );
					}

					try {
						await child.save();
					}
					catch( e ) {
						errors.push( `chron: error saving child ${ child.displayNameAndRegistration } - ${ e }` );
					}
				};
				// log each of the errors to the console
				for( let error of errors ) {
					console.error( error );
				}

				resolve();

			}, err => {

				console.error( `error fetching children for nightly chron job - ${ err }` );
				reject();
			});	
		
	});
};