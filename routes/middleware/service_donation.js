const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  fs			= require( 'fs' ),
	  handlebars	= require( 'handlebars' ),	
	  helpers       = require( '../../templates/views/helpers/index' )(),
	  stripe		= require( 'stripe' )( process.env.STRIPE_SECRET_API_KEY_TEST ),
	  Donation		= keystone.list( 'Donation' );
	  
// define the various donation plan types ( stripe plans are used for recurring donations )
const plan_types = {

	onetime: {
		id: 'onetime',
		interval: 'none',
		interval_count: 0
	},
	
	monthly: {
		id: 'monthly',
		interval: 'month',
		interval_count: 1
	},

	annual: {
		id: 'annual',
		interval: 'month',
		interval_count: 12
	},

	biannual: {
		id: 'biannual',
		interval: 'month',
		interval_count: 6
	}
};

// define the various response message types
const message_types = {

	ERROR: 'error',
	SUCCESS: 'success',
};

// process a one-time donation via the Stripe Charge API
function oneTimeDonation( donationData ) {

	return new Promise( ( resolve, reject ) => {

		stripe.charges.create({
			amount: 	donationData.amountPennies,
			currency: 	'usd',
			source: 	donationData.token
		}, function( error, charge ) {

			if ( error ) {

				reject( error );
			} else {

				resolve( charge );
			}
		});
	});
}

// process a recurring donation using the Stripe Customer, Plan, and Subscription APIs
function recurringDonation( donationData ) {

	return new Promise( ( resolve, reject ) => {

		// create a new stripe customer using the donator's email
		createCustomer( donationData )
			.then( customer => createPlan( customer, donationData ) )
			.then( plan => createSubscription( plan ) )
			.then( subscription => {

				resolve( subscription );
			})
			.catch( error => {

				reject( error );
			});
	});
}

// determine which type of charge to create based on the donation frequency
function setDonationType( donationFrequency ) {

	// if the donation frequency is greater than zero, it is a recurring charge
	if ( donationFrequency > 0 ) {

		return recurringDonation;
	
	// if the frequency is not greater than zero, it is a one-time charge
	} else {

		return oneTimeDonation;
	}
}

// save the donation details in a Donation model
function saveDonation( user, donationData, stripeTransactionID  ) {

	return new Promise( ( resolve, reject ) => {

		const isRegistered = !!user;

		// create new Donation model and pre-fill with donation data
		var donation = new Donation.model({
			date				: Date.now(),
			amount				: donationData.amountDollars,
			onBehalfOf			: donationData.honoree,
			isSubscription		: donationData.frequency > 0,
			isRegistered		: isRegistered,
			userType			: isRegistered ? user.userType : undefined,
			siteVisitor			: isRegistered && user.userType === 'site visitor' ? user.get( '_id' ) : undefined,
			socialWorker		: isRegistered && user.userType === 'social worker' ? user.get( '_id' ) : undefined,
			family				: isRegistered && user.userType === 'family' ? user.get( '_id' ) : undefined,
			admin				: isRegistered && user.userType === 'admin' ? user.get( '_id' ) : undefined,
			unregisteredUser	: !isRegistered ? donationData.donator : undefined,
			stripeTransactionID	: stripeTransactionID
		});

		// save the Donation model to the db
		donation.save( error => {

			if ( error ) {

				reject( error );
			} else {

				resolve( donation );
			}
		});
	});
}

// create a stripe customer
function createCustomer( donationData ) {

	return new Promise( ( resolve, reject ) => {

		stripe.customers.create({
			email: donationData.email,
			source: donationData.token
		}, ( error, customer ) => {

			error ? reject( error ) : resolve( customer );
		});
	});


}

// create a stripe billing plan
// plans describe the terms of Subscriptions, which allow donators to schedule repeat donations
function createPlan( customer, donationData ) {

	return new Promise( ( resolve, reject ) => {

		// determine plan name based on donation amount and frequency
		let planName;
		// format the donation amount for the plan name text
		const usdFormatter				= new Intl.NumberFormat( 'en-US', { style: 'currency', currency: 'USD' } ),
			  donationAmountFormatted	= usdFormatter.format( donationData.amountDollars );
		
		// set the plan name with frequency and amount
		switch ( donationData.frequency ) {

			case 1: planName = `Monthly Donation - ${ donationAmountFormatted }`; break;
			case 6: planName = `Bi-Annual Donation - ${ donationAmountFormatted }`; break;
			case 12: planName = `Annual Donation - ${ donationAmountFormatted }`; break;
		}

		// create the plan
		stripe.plans.create({
				name			: planName,
				id				: `plan_${ donationData.amountPennies }_${ customer.id }`,
				interval		: 'month',
				interval_count	: donationData.frequency,
				amount			: donationData.amountPennies,
				currency		: 'usd'
			}, ( error, plan ) => {

				if ( error ) {

					reject( error );

				} else {

					// add customer id to plan object so it is accessible in the create subscription function
					plan.customer = customer;

					resolve( plan );
				}
		});
	});


}

// subscripe a customer to a payment plan
// subscriptions represent recurring donations
function createSubscription( plan ) {

	return new Promise( ( resolve, reject ) => {

		stripe.subscriptions.create({
			customer: plan.customer.id,
			items: [ { plan: plan.id } ]
		}, function( error, subscription ) {

			if ( error ) {

				reject( error );
			} else {

				resolve( subscription );
			}
		});
	});
}

// generates a flash message to display the donation transaction status
function generateFlashMessage( messageType, title, message ) {
	
	// get the relative path to the flash-messages hbs template partial
	var templatePath = `${ __dirname }/../../templates/views/partials/flash-messages.hbs`;

	return new Promise( ( resolve, reject ) => {

		// read the hbs template
		fs.readFile( templatePath, ( error, data ) => {

			// generate the markup for the flash messages
			if ( !error ) {

				// create the flash messages object
				var messages = {};
				
				// add the message type
				messages[ messageType ] = [{
					title,
					detail: message
				}];

				// get the contents of the file as a string
				const templateString = data.toString();
				// compile the template string
				const template = handlebars.compile( templateString );
				// register the flashMessages helper
				handlebars.registerHelper( 'flashMessages', helpers.flashMessages );

				// interpolate the template with flash message data
				const html = template( { messages } );

				resolve( html );

			// reject with error
			} else {
				reject( error );
			}
		});
	});
}

exports = module.exports = {

	// processes a donation by creating CC charge via Stripe API
	// saves the donation and processing details in a Donation model
	processDonation: function processDonation( req, res, next ) {

		// get donation data from request body
		var donationData = {
			// donation amount in pennies ( stripe requires amounts in the smallest denomination possible )
			amountPennies: req.body.amount,
			// donation amount in dollars
			amountDollars: req.body.amount / 100,
			// donation frequency
			frequency: req.body.frequency,
			// donator name
			donator: req.body.donator,
			// donation in the name of
			honoree: req.body.honoree,
			// stripe charge auth token
			token: req.body.token.id,
			// stripe charge email
			email: req.body.token.email
		};

		// determine which type of donation payment plan to generate based on the donation frequency 
		var processDonationPayment = setDonationType( donationData.frequency );

		// process the donation via the appropriate stripe payment API ( depending on payment plan, determined in the previous step )
		processDonationPayment( donationData )
			// save the donation data to the MARE db as a Donation model
			.then( stripeTransactionResponse => saveDonation( req.user, donationData, stripeTransactionResponse.id ) )
			// send a success message to the user
			.then( dbResponse => generateFlashMessage( message_types.SUCCESS, 'Success!', 'Thank you for your donation, payment has been processed succesfully.' ) )
			// generate a success message to display on the front end
			.then( flashMessageMarkup => {

				res.send({
					status: 'success',
					message: flashMessageMarkup
				});
			})
			.catch( error => {

				// generate an error message to display on the front end
				generateFlashMessage( message_types.ERROR, 'Error!', error.message )
					.then( flashMessageMarkup => {

						res.send({
							status: 'error',
							message: flashMessageMarkup
						});	
					});
			});
	},
	
	// validate the donation request body before processing payment
	validateDonationRequest: function validateDonationRequest( req, res, next ) {

		// validation error flag
		let validationError = false;

		// convert donation amount to a number
		const donationAmount = Number( req.body.amount );
		// test to ensure donationamount is a valid number ( positive, finite, !NaN )
		if ( Number.isFinite( donationAmount ) ) {
			
			req.body.amount = donationAmount;
		} else {
			
			validationError = true;
			res.send( generateError( 'Donation amount is not a valid number.' ) );
			return;
		}

		// convert donation frequency to a number
		const donationFrequency = Number( req.body.frequency );
		// test to ensure donation frequency is a valid number ( positive, finite, !NaN )
		if ( Number.isFinite( donationFrequency ) && isValidDonationFrequency( donationFrequency ) ) {

			req.body.frequency = donationFrequency;
		} else {
			
			validationError = true;
			res.send( generateError( 'Donation frequency does not match any donation plan.' ) );
			return;
		}

		// trim whitespace from the donator name
		const donatorName = req.body.donator.trim();
		// ensure a donator name was entered
		if ( !donatorName ) {

			// if there is no name, or the name is left empty, label the donator as 'Anonymous'
			req.body.donator = 'Anonymous';
		} else {

			req.body.donator = donatorName;
		}

		// if there are no validation errors, continue middleware execution
		if ( !validationError ) {

			next();
		}

		// helper to generate error response
		function generateError( message ) {

			return {
				status: 'error',
				message
			};
		}

		// helper to validate that the specified frequency exists as an interval in a plan type
		function isValidDonationFrequency( frequency ) {

			for ( let plan in plan_types ) {

				if ( plan_types[ plan ].interval_count === frequency ) {

					// if the donation frequency matches any plan interval it is valid
					return true;
				}
			}

			// if the donation frequency is not matched it is not valid
			return false;
		}
	},

	// plan types constants
	PLAN_TYPES: plan_types
};