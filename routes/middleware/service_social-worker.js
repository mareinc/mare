const keystone            = require( 'keystone' ),
	  SocialWorker        = keystone.list( 'Social Worker' );
 
// TODO: this implementation is ugly, it needs to be rewritten in a non-crappy way
exports.getSocialWorkerById = ( id, container, field, done ) => { 
    // if the id isn't set
	if( !id ) {
        // return control to the calling context
        return done();
    }
    // fetch the social worker record
    SocialWorker.model.findById( id )
        .exec()
        .then( socialWorker => {
            // set the field from the outer context to the social worker
            container[ field ] = socialWorker;
            // return control to the parent context
            done();
        });
};