const keystone	= require( 'keystone' ),
	  moment	= require( 'moment' ),
	  stripe	= require( 'stripe' )( process.env.STRIPE_SECRET_API_KEY_TEST ),
	  Donation	= keystone.list( 'Donation' );
	  
/* define subscription plan types as per stripe API: https://stripe.com/docs/api#create_plan */
const plan_types = {

	onetime: {
		id: 'one time',
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
		interval: 'year',
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

// some helper functions
function createStripeCustomer( stripeToken, email ) {
	
	// create stripe customer
	return stripe.customers.create({
			email: email, 
			source: stripeToken
	});
}

function createCharge( customer, amount ) {

	return stripe.charges.create({
		amount: amount,
		currency: 'usd',
		customer: customer.id
	});
}

function createPlan( customer, amount, plan_type ) {

	return stripe.plans.create({
		amount: amount,
		name: plan_type.id,
		id: plan_type.id,
		currency: 'usd',
		interval: plan_type.interval,
		interval_count: plan_type.interval_count ? plan_type.interval_count : 1
	});
}

exports = module.exports = {

	oneTimeCharge: ( req, res, next ) => {

		console.log( req.body );
		res.send( 'great success' );

		// https://stripe.com/docs/charges
	
		// return new Promise( ( resolve, reject ) => {

		// 	createStripeCustomer( stripeToken, email )
		// 		.then( customer => createCharge( customer, amount ) )
		// 		.then( charge => {
		// 			// log the customer has been charged x 
		// 			resolve();
		// 		})
		// 		.catch( error => {
		// 			// log the error 
		// 			reject();   
		// 		});
		// });
	},

	recurringCharge: ( stripeToken, email, amount, plan_type ) => {
	
		return new Promise( ( resolve,reject ) => {

			createStripeCustomer( stripeToken, email )
				.then( customer => createPlan( customer,amount,plan_type ) )
				.then( plan => {
					//Log the plan has been created and is ready to be used
					resolve();
				})
				.catch( error => {
					//Log the error 
					reject();   
				});
		});
	},

	PLAN_TYPES: plan_types
};