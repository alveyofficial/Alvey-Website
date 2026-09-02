const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../env/.env')});


const { Client, Account, Users, ID, OAuthProvider } = require('node-appwrite');
const { client } = require('../../appwrite');

//this client already has the api key set from appwrite.js, appwrite lets an
//api key create sessions as long as it has the sessions.write scope on
//so we just reuse it instead of making a second one
const account = new Account(client);
const users = new Users(client);

//signup just makes the account, this uses the Users service so it needs the api key
//email verification is a separate step after this, done once the user has a session
const signUp = async(name, email, password) =>{
    try{
        const newUser = await users.create({
            userId: ID.unique(),
            email,
            password,
            name
        });
        return newUser;
    } catch(err){
        console.log("Error Signing Up : "+err.message);
        return err.message;
    }
};

//checks email+password and hands back a real session object (has .secret and .expire)
//the route turns .secret into the cookie
const signIn = async(email, password) =>{
    try{
        const session = await account.createEmailPasswordSession({
            email,
            password
        });
        return session;
    } catch(err){
        console.log("Error Signing In : "+err.message);
        return err.message;
    }
};

//sends the verification email, needs a logged in session first (thats why
//the route calls this using a client built from the users cookie, not the
//admin one)
const sendVerificationEmail = async(sessionSecret, redirectUrl) =>{
    try{
        const sessionClient = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_ID)
            .setSession(sessionSecret);

        const sessionAccount = new Account(sessionClient);
        const token = await sessionAccount.createEmailVerification({
            url: redirectUrl
        });
        return token;
    } catch(err){
        console.log("Error Sending Verification Email : "+err.message);
        return err.message;
    }
};

//confirms the verification link, userId and secret come from the query
//string on the link the user clicked
const confirmVerification = async(userId, secret) =>{
    try{
        const result = await account.updateEmailVerification({
            userId,
            secret
        });
        return result;
    } catch(err){
        console.log("Error Confirming Verification : "+err.message);
        return err.message;
    }
};

//sends the password reset email, this one CAN use the admin account since
//it doesnt need to know who is logged in, just the email typed in
const sendRecoveryEmail = async(email, redirectUrl) =>{
    try{
        const token = await account.createRecovery({
            email,
            url: redirectUrl
        });
        return token;
    } catch(err){
        console.log("Error Sending Recovery Email : "+err.message);
        return "Could not send recovery email :(";
    }
};

//finishes the reset, userId and secret come from the reset link, password
//is the new one the user just typed
const confirmRecovery = async(userId, secret, password) =>{
    try{
        const result = await account.updateRecovery({
            userId,
            secret,
            password
        });
        return result;
    } catch(err){
        console.log("Error Confirming Recovery : "+err.message);
        return err.message;
    }
};

//step 1 of oauth, gives back a url to redirect the user to (google/linkedin/discord login page)
const getOAuthRedirect = async(provider, successUrl, failureUrl) =>{
    try{
        const providerMap = {
            google: OAuthProvider.Google,
            linkedin: OAuthProvider.Linkedin,
            discord: OAuthProvider.Discord
        };

        if(!providerMap[provider]){
            return "Unknown provider";
        }

        const redirectUrl = await account.createOAuth2Token({
            provider: providerMap[provider],
            success: successUrl,
            failure: failureUrl
        });
        return redirectUrl;
    } catch(err){
        console.log("Error Getting OAuth Redirect : "+err.message);
        return "Could not start oauth login :(";
    }
};

//step 2 of oauth, the provider sends the user back here with userId+secret
//in the url, this turns those into a real session same as signIn does
const finishOAuthSession = async(userId, secret) =>{
    try{
        const session = await account.createSession({
            userId,
            secret
        });
        return session;
    } catch(err){
        console.log("Error Finishing OAuth Session : "+err.message);
        return "Could not finish oauth login :(";
    }
};

//roles live as appwrite labels now instead of the old users collection,
//a fresh signup has no labels at all, the route treats that as the default
//student/guest landing page
const getRoles = async(userId) =>{
    try{
        const user = await users.get({ userId });
        return user.labels;
    } catch(err){
        console.log("Error Getting Roles : "+err.message);
        return [];
    }
};

module.exports = {
    signUp,
    signIn,
    sendVerificationEmail,
    confirmVerification,
    sendRecoveryEmail,
    confirmRecovery,
    getOAuthRedirect,
    finishOAuthSession,
    getRoles
};