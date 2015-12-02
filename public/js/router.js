app.router = function() {
	initializeRouter = function() {

		// handle basic routing, initializing based on the result
		switch(app.url.siteArea) {
			case '':
				setupHomePage();
				break;
			case 'page':
				setupGeneralPage();
				break;
			case 'form':
				setupForm();
				break;
			case 'waiting-child-profiles':
				setupWaitingChildProfilesPage();
				break;
			case 'register':
				setupRegistrationPage();
				break;
			case 'preferences':
				setupPreferencesPage();
				break;
			case 'donate':
				setupDonationsPage();
				break;
			default:
				console.log('default route, nothing matched');
		}
	};

	setupHomePage = function() {
		console.log('home page route');
		app.functions.initializeHomePage();
	};

	setupGeneralPage = function() {
		console.log('page route');
	};

	setupForm = function() {
		console.log('form route');
	};

	setupWaitingChildProfilesPage = function() {
		console.log('waiting child profiles route');
		app.functions.initializeWaitingChildProfilesPage();
	};

	setupRegistrationPage = function() {
		console.log('registration route');
		app.functions.initializeRegistrationPage();
	};

	setupPreferencesPage = function() {
		console.log('preferences route');
	};

	setupDonationsPage = function() {
		console.log('donate route');
		app.functions.initialzeDonationsPage();
	};

	return {
		initializeRouter: initializeRouter
	}
}();