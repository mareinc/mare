const StaffEmailTarget = keystone.list( 'Staff Email Target' );

exports.getTargetId = ( req, res, emailTarget, done ) => {

	let locals = res.locals;

    StaffEmailTarget.model.findOne()
			.where( 'staffEmailTarget', emailTarget )
			.exec()
			.then( target => {
				
				locals.emailTargetId = target.get( '_id' );
                done();
			});
}