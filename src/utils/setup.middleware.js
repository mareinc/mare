// initialize the standard view locals
exports.initLocals = function( req, res, next ) {
	'use strict';

	var locals = res.locals;

	// store the host information to ensure changes between http and https are handled correctly
	locals.host = req.secure ?
		`https://${ req.headers.host }` :
		`http://${ req.headers.host }`;

	locals.navLinks = [
		{ label: 'Home', key: 'home', href: '/' }
	];
	// store a reference to the logged in user object if one exists
	locals.user = req.user;
	// store whether the user is logged in
	locals.isLoggedIn = !!req.user;
	// store the CloudFront url for image urls
	locals.cloudfrontUrl = process.env.CLOUDFRONT_URL;

	const HUBSPOT_SITE_BASE_URL = process.env.HUBSPOT_SITE_BASE_URL || 'https://21835120.hs-sites.com';

	// create the main menu navigation.
	locals.mainNav = [
		// TODO: add custom header background image for each menu item
		{ title: 'Meet the Children', subMenu: [
			{ title: 'Featured Youth', href: `${HUBSPOT_SITE_BASE_URL}/featured-youth` },
			{ title: 'Child Profiles', href: '/waiting-child-profiles' },
			{ title: 'Who are the Children?', href: `${HUBSPOT_SITE_BASE_URL}/who-are-the-children` }
		]},
		{ title: 'Considering Adoption?', subMenu: [
			{ title: 'How To Adopt From Foster Care', href: `${HUBSPOT_SITE_BASE_URL}/how-to-adopt-from-foster-care` },
			{ title: 'Stories', href: `${HUBSPOT_SITE_BASE_URL}/stories` },
			{ title: 'FAQ', href: `${HUBSPOT_SITE_BASE_URL}/frequently-asked-questions` },
			{ title: 'Get Support', href: `${HUBSPOT_SITE_BASE_URL}/get-support` }
		]},
		{ title: 'Resources', subMenu: [
			{ title: 'E-Books & Downloads', href: `${HUBSPOT_SITE_BASE_URL}/resources` },
			{ title: 'Learning Center', href: `${HUBSPOT_SITE_BASE_URL}/articles` }
		]},
		{ title: 'Events', subMenu: [
			{ title: 'MARE Family Events', href: '/events/mare-hosted-events/'},
			{ title: 'Partner Hosted Events', href: HUBSPOT_SITE_BASE_URL },
			{ title: 'MAPP Training', href: HUBSPOT_SITE_BASE_URL },
			{ title: 'Community Events', href: HUBSPOT_SITE_BASE_URL }
		]},
		{ title: 'About Us', lastMenu: true, subMenu: [
			{ title: 'Why We Exist', href: `${HUBSPOT_SITE_BASE_URL}/who-we-are` },
			{ title: 'Our Values and Commitments', href: `${HUBSPOT_SITE_BASE_URL}what-we-do` },
			{ title: 'Our Organization', href: `${HUBSPOT_SITE_BASE_URL}/our-organization` },
			{ title: 'News and Updates', href: `${HUBSPOT_SITE_BASE_URL}/news-and-updates` },
		]},
		{ title: 'Get Involved', subMenu: [
			{ title: 'Donate', href: 'https://secure.givelively.org/donate/massachusetts-adoption-resource-exchange-inc' },
			{ title: 'Weekend Family Connections', href: `${HUBSPOT_SITE_BASE_URL}/weekend-family-connections` },
			{ title: 'Join the Neighborhood', href: `${HUBSPOT_SITE_BASE_URL}/join-the-neighborhood` },
			{ title: 'Raise Support', href: `${HUBSPOT_SITE_BASE_URL}/raise-support` },
			{ title: 'Shop', href: 'https://store.mareinc.org/' }
		]}];

	// based on the url from the requested page, fetch the navigation object for the site section
	locals.currentSection = locals.mainNav.find( section => {
		return section.subMenu.find( menuItem => {
			return menuItem.href === req.url;
		});
	});
	// mark the navigation section as selected to allow us to display an active marker during templating
	if( locals.currentSection ) {
		locals.currentSection.selected = true;
	}

	// set a flag when in a production environment
	if  ( process.env.NODE_ENV === 'production' ) {
		locals.isProduction = true;
	}

	locals.footerLinks = {
		contactUs: `${HUBSPOT_SITE_BASE_URL}/contact-us`,
		privacyPolicy: `${HUBSPOT_SITE_BASE_URL}/privacy-policy`,
		nonDiscrimination: `${HUBSPOT_SITE_BASE_URL}/nondiscrimination-policy`,
		ourPartners: `${HUBSPOT_SITE_BASE_URL}/our-partners`,
	};

	next();
};

// initialize global error handlers
exports.initErrorHandlers = function initErrorHandlers( req, res, next ) {
    
    res.err = function( 
		title = '500 - Internal Server Error',
		message = `Oops!<br><br> We encountered an error trying to process your request. Try submitting your request again. If the problem persists, contact us at <a href="mailto:web@mareinc.org">web@mareinc.org</a>.`
	) {
        res.status( 500 ).render( 'errors/500', {
            errorTitle: title,
            errorMsg: message
        });
    }
    
    res.notFound = function(
		title = '404 - Page Not Found',
		message = `Oops!<br><br> We can't seem to find the page you are looking for. Let's get you back on track.`
	) {
        res.status( 404 ).render( 'errors/404', {
            errorTitle: title,
            errorMsg: message
        });
    }
    
    next();
};	
