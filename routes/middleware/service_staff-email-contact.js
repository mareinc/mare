// TODO: big departure from how I wrote everything, but no fetching middleware should put anything on locals if it can be helped.
//       Instead, we should return the values from the fetch function and the calling function can determine what to do with the result

const StaffEmailContact = keystone.list( 'Staff Email Contact' );

exports.getContact = ( req, res, targetId, done ) => {

    let locals = res.locals;

    StaffEmailContact.model.findOne()
			.where( 'emailTarget', targetId )
            .populate( 'staffEmailContact' )
			.exec()
			.then( staffContact => {

                locals.staffContactEmail = staffContact.staffEmailContact.get( 'email' );
                locals.staffContactName = staffContact.staffEmailContact.name.full;

                done();
			});
}