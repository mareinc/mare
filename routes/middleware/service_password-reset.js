var
    keystone = require('keystone'),
    utilities = require('./utilities'),
    PasswordResetEmailMiddleware = require('./emails_password-reset');
UserMiddleware = require('./service_user')


//TODO: @Jared please check the error and success messages for conformity 


/**
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.resetPassword = function resetPassword(req, res) {

    if (!req.body.email) {
        req.flash('error', {
            title: 'Something went wrong',
            detail: 'Please enter an email address.'
        });
        res.redirect('/');
        return;
    }

    UserMiddleware.getUserByEmail(req.body.email)
        .then(user => {

            if (!user) {
                console.error(`Error getting user for password recovery`);
                req.flash('error', {
                    title: 'Something went wrong',
                    detail: 'We could not get the user account associated to that email.'
                });
            }
            else {
                //generate a new resetPassword token 
                const resetToken = utilities.generateAlphanumericHash(35); //@JARED this should probably be in a const file?
                const host = req.secure ? `https://${req.headers.host}` : `http://${req.headers.host}`;
                user.resetPasswordToken = resetToken;

                //create an email with the reset token and save the user entity 
                const resetPasswordEmail = PasswordResetEmailMiddleware.sendPasswordResetEmail(user.name.full, user.email, host, resetToken);
                const saveUser = user.save((err) => {
                    if (err) {
                        console.error(`error saving user with reset password token ${err}`);
                        throw new Error('could not save the updated user entity');
                    }
                });

                resetPasswordEmail.catch(reason => {
                    console.error(`error sending reset password email: ${reason}`);
                    throw new Error('could not send an email to the user');
                });

                req.flash('success', {
                    title: 'Success',
                    detail: 'We have emailed you a link to reset your password. Please follow the instructions in your email.'
                });
            }

            res.redirect('/');
        })
        .catch(err => {
            console.error(`Password reset error getting user: ${err}`);

            req.flash('error', {
                title: 'Something went wrong',
                detail: 'We could not complete your request.'
            });

            res.redirect('/');
        });

};

/**
 * @JARED this function should technically be in the view folder
 * but I do not think the amount of code in it warrants creating a new file ?
 * @param {*} req 
 * @param {*} res 
 */
exports.getForm = function getForm(req, res) {

    const resetToken = req.query.resetToken;

    if (!resetToken) {
        console.error(`password reset error: reset token not provided`);
        res.redirect('/');
        return;
    }

    UserMiddleware.getUserByPasswordResetToken(resetToken)
    .then(user => {

        if (!user) {
            console.error(`Error getting user for password recovery`);
            req.flash('error', {
                title: 'Error could not find request',
                detail: 'The reset token provided is not valid or expired. Please try using the forgot password button again.'
            });
            res.redirect('/');
            return;
        }
       

    const view = new keystone.View(req, res),
    locals = res.locals;

    //pass the reset token to the view
    locals.resetToken = resetToken;

    view.render('form_reset-password');

    })
    .catch(err => {
        console.error(`Password reset error getting user: ${err}`);

        req.flash('error', {
            title: 'Something went wrong',
            detail: 'We could not complete your request.'
        });

        res.redirect('/');
    });
};


exports.changePassword = function changePassword(req, res) {

    const resetToken = req.body.resetToken,
        password = req.body.password,
        confirm_password = req.body.confirm_password;

    if (!resetToken) {
        console.error(`no reset Token provided to changePassword handler`);
        res.send('stop trolling');
        return;
    }

    //check passwords are correct - validation is done through parsley on the front end!

    //fetch user with the reset token 
    UserMiddleware.getUserByPasswordResetToken(resetToken)
        .then(user => {

            if (!user) {
                console.error(`Error getting user for password recovery`);
                req.flash('error', {
                    title: 'Error could not find request',
                    detail: 'The reset token provided is not valid or expired. Please try using the forgot password button again.'
                });
            }
            else {
                user.set( 'password', password);
                //reset the password token so that users cant use the link anymore
                user.set( 'resetPasswordToken', ''); 

                const saveUser = user.save((err) => {
                    if (err) {
                        console.error(`error saving user model with new password ${err}`);
                        throw new Error('could not save the updated user entity');
                    }
                });

                req.flash('success', {
                    title: 'Success',
                    detail: `The password for your account ${user.get('email')} has been successfully changed. Click on the login button to login with your new password.`
                });
            }

            res.redirect('/');
        })
        .catch(err => {
            console.error(`Password reset error getting user: ${err}`);

            req.flash('error', {
                title: 'Something went wrong',
                detail: 'We could not complete your request.'
            });

            res.redirect('/');
        });
};