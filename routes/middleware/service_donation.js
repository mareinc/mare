const keystone	= require( 'keystone' ),
	  moment	= require( 'moment' ),
	  stripe	= require( 'stripe' )( process.env.STRIPE_SECRET_API_KEY_TEST ),
	  Donation	= keystone.list( 'Donation' );
	  
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

	semiannual: {
		id: 'semiannual',
		interval: 'month',
		interval_count: 6  /* interval_count: The number of intervals between each subscription billing. 
												For example, interval = month and interval_count = 3 bills every 3 months.
												Maximum of one year interval allowed (1 year, 12 months, or 52 weeks).*/
	}
};

// process a one-time donation via the Stripe Charge API
function oneTimeDonation( donationData ) {

	return new Promise( ( resolve, reject ) => {

		stripe.charges.create({
			amount: 	donationData.amount,
			currency: 	'usd',
			source: 	donationData.token
		}, 
		function( error, charge ) {

			if ( error ) {

				reject( error );
			} else {

				resolve( charge );
			}
		});
	});
}

function recurringDonation( customer, amount, plan_type ) {

	return stripe.plans.create({
		amount: amount,
		name: plan_type.id,
		id: plan_type.id,
		currency: 'usd',
		interval: plan_type.interval,
		interval_count: plan_type.interval_count ? plan_type.interval_count : 1
	});
}

// determines which type of charge to create based on the donation frequency
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
function saveDonation( user, donationData, stripeChargeID  ) {

	return new Promise( ( resolve, reject ) => {

		// create new Donation model and pre-fill with donation data
		var donation = new Donation.model({
			date: 					Date.now(),
			amount: 				donationData.amount / 100,
			onBehalfOf:				donationData.honoree,
			stripeTransactionID:	stripeChargeID
		});

		// if the donator is logged in, add user details
		if ( user ) {

			donation.isRegistered = true;

		// if the donator is not logged in, try to add name details
		} else {

			donation.isRegistered = false;
			donation.unregisteredUser = donationData.donator;
		}

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

exports = module.exports = {

	// processes a donation by creating CC charge via Stripe API
	// saves the donation and processing details in a Donation model
	processDonation: ( req, res, next ) => {

		// get donation data from request body
		var donationData = req.body;

		// parse numeric fields
		donationData.amount = parseInt( donationData.amount );
		donationData.frequency = parseInt( donationData.frequency );

		// determine which type of donation payment plan to generate based on the donation frequency 
		var processDonationPayment = setDonationType( donationData.frequency );

		// process the donation
		processDonationPayment( donationData )
			.then( stripeChargeResponse => saveDonation( req.user, donationData, stripeChargeResponse.id ) )
			.then( dbResponse => {

				console.log( dbResponse );
				res.send( 'success' );
			})
			.catch( error => {

				console.log( error );
				res.send( error );	
			});
	},
	
	// plan types constants
	PLAN_TYPES: plan_types
};