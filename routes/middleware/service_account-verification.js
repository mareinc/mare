/*
*   #126: User was sent a thank you email and they clicked on the email to verify their account
*   
*/
const keystone 						= require( 'keystone' ),
      AccountVerificationCode		= keystone.list( 'Account Verification Code' ),
      SiteVisitor 					= keystone.list( 'Site Visitor' ),
	  SocialWorker 					= keystone.list( 'Social Worker' ),
	  Family						= keystone.list( 'Family' );


module.exports = function(req,res){

    const verificationCode = req.query.verificationCode;
    const userType         = req.query.userType;

    if(!verificationCode || !userType){
        //@jared: how do you want to handle this error 
        console.error(`Account verification Error - Bad request Params -> verificationCode: ${verificationCode} , userType: ${userType}`);
        res.status(400).send('Bad Parameters');
        return;
    }

    //Now that we have the verification code we need to delete the record from the database 
    //and set the user's is verified to true?

    AccountVerificationCode.model
        .findOne()
        .where('code', verificationCode)
        .exec( (err, verificationEntity) =>{

            if(err){
                console.error(err);
                return; 
            }

            if(!verificationEntity){
                console.error(`Account verification Error - Could not find verification model based on verification code ${verificationCode}`);
                res.status(404).send('Verification Record not found.');
                return;
            }
            
            //We found the verificationEntity and we want to remove it
            var userId = verificationEntity.user;

            updateUser(userId, userType)
                .then( () =>{

                    //Delete the verification record 
                    verificationEntity.remove( (err) => {
                        if(err)
                            console.error('Account verification Error - Could not remove the verification model entity.');
                    });
                    //@jared I would like to either create a view or redirect to the main page and show flash message
                    res.status(200).send('Hello Jared Please let me setup a view or a flash message? Maybe? Hmmmmm.....');
                })  
                .catch( () =>{
                    console.error('Account verification Error - could not update the user field');
                });
        });
};



/**
 *  @PARAMS:    userId - User id to use for accessing MARE User Models
 *              userType - MARE user type 
 *  This function updates the isVerified field of the user 
 */
function updateUser(userId, userType){

    return new Promise( (resolve, reject) =>{

        var model;

        if(userType === 'site visitor')
            model = SiteVisitor.model;
        else if(userType === 'family')
            model = Family.model;
        else
            model = SocialWorker.model;

        model.findById(userId)
            .exec( (err, user) =>{
                if(err){
                    console.error(`Account Verification Error - Could not find user ${userId}`);
                    reject(err);
                }

                //Set the user to verified
                user.permissions.isVerified = true;
                //Save user 
                user.save( (err) => {
                    if(err){
                        console.error(`Account Verification Error - Could not save updated user ${userId}`);
                        reject();
                    }
                });
                
                resolve();
            });

    });
}