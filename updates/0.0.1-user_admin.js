/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

exports.create = {
	Admin: [{
		isActive: true,
		name: {
			first: 'Admin',
			last: 'User'
		},
		permissions: {
			isVerified: true
		},
		password: 'admin',
		email: 'admin@keystonejs.com'
	},{
		isActive: true,
		name: {
			first: 'Migration',
			last: 'Bot'
		},
		permissions: {
			isVerified: true,
			canMigrate: true
		},
		password: 'VEbDV*ctV6EyxCFPUVdV6MKAvopxs^28h)w4vwgCZZvfBd}Bn#',
		email: 'jared.collier@yahoo.com'
	},{
		isActive: true,
		name: {
			first: 'Website',
			last: 'Bot'
		},
		permissions: {
			isVerified: true
		},
		password: 'VN9uiE&geNx/wgC@woBjMvZqBvnibX9bouXgz4gJD4HrEh.uH/JoQD6hJddnGJyH',
		email: 'junit83@gmail.com'
	},{
		isActive: true,
		name: {
			first: 'Jared',
			last: 'Collier'
		},
		permissions: {
			isVerified: true
		},
		password: 'JaredCollier',
		email: 'jared.j.collier@gmail.com'
	},{
		isActive: true,
		name: {
			first: 'Lisa',
			last: 'Funaro'
		},
		permissions: {
			isVerified: true
		},
		password: 'LisaFunaro',
		email: 'lisafd4@gmail.com'
	}]
};