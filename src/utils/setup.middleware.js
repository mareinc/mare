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

	// create the main menu navigation.
	locals.mainNav = [
		// TODO: add custom header background image for each menu item
		{ title: 'Considering Adoption?', subMenu: [
			{ title: 'Types of Adoption', href: '/page/types-of-adoption' },
			{ title: 'Can I adopt a Child from Foster Care?', href: '/page/can-i-adopt-a-child-from-foster-care' },
			{ title: 'Steps in the Process', href: '/steps-in-the-process' },
			{ title: 'How Can MARE Help?', href: '/page/how-can-mare-help' },
			{ title: 'Adoption Stories', href: '/adoption-stories' }
		]},
		{ title: 'Meet the Children', subMenu: [
			{ title: 'Who are the Children?', href: '/page/who-are-the-children' },
			{ title: 'Waiting Child Profiles', href: '/waiting-child-profiles' },
			{ title: 'Other Ways to Meet Waiting Children', href: '/page/other-ways-to-meet-waiting-children' }
		]},
		{ title: 'Family Support Services', subMenu: [
			{ title: 'How Does MARE Support Families', href: '/page/how-does-mare-support-families' },
			{ title: 'Friend of the Family Mentor Program', href: '/page/friend-of-the-family-mentor-program' },
			{ title: 'Other Family Support Services', href: '/page/other-family-support-services' }
		]},
		{ title: 'For Social Workers', subMenu: [
			{ title: 'How MARE Can Help You', href: '/page/how-mare-can-help-you' },
			{ title: 'Register/Update a Child', href: '/page/register-update-a-child' },
			{ title: 'Attend Events', href: '/page/attend-events' },
			{ title: `Register a Family's Homestudy`, href: '/page/register-a-familys-homestudy' }
		]},
		{ title: 'Events', subMenu: [
			{ title: 'MARE Hosted Events', href: '/events/mare-hosted-events/'},
			{ title: 'Partner Hosted Events', href: '/events/partner-hosted-events'},
			{ title: 'MAPP Training', href: '/events/mapp-trainings/' }
		]},
		{ title: 'Ways to Help', subMenu: [
			{ title: 'Why give?', href: '/page/why-give' },
			{ title: 'How you can help', href: '/page/how-you-can-help' },
			{ title: 'How businesses and organizations can help', href: '/page/how-businesses-and-organizations-can-help' },
			{ title: 'Experienced families', href: '/page/experienced-families' },
			{ title: 'Weekend Family Connections', href: '/page/weekend-family-connections' },
			{ title: 'The Neighborhood', href: '/page/the-neighborhood' },
			{ title: 'Shop', href: 'https://store.mareinc.org' }
		]},
		{ title: 'About Us', lastMenu: true, subMenu: [
			{ title: 'Who We Are', href: '/page/who-we-are' },
			{ title: 'What We Do', href: '/page/what-we-do' },
			{ title: 'Meet the Staff', href: '/page/meet-the-staff' },
			{ title: 'Board of Directors', href: '/page/board-of-directors' },
			{ title: 'Annual Report', href: '/page/annual-report' },
			{ title: 'Careers', href: '/page/careers' }
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

	next();
};

// initialize global error handlers
exports.initErrorHandlers = function initErrorHandlers( req, res, next ) {
    
    res.notFound = function(
		title = '404 - Page Not Found',
		message = `Sorry, we can't seem to find the page you're looking for.`
	) {
        res.status( 404 ).render( 'errors/404', {
            errorTitle: title,
            errorMsg: message
        });
    }
    
    next();
};	
