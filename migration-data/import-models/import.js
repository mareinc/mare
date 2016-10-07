/**
 * Created by Adrian Suciu.
 */
var agencies = require('agency_model'),
	children = require('child_model'),
	events = require('event_model'),
	families = require('family_model');

agencies.importAgencies();
children.importChildren();
events.importEventModels();
families.importFamilies();
