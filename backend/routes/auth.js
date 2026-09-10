const {
    signUp,
    signIn,
    sendVerificationEmail,
    confirmVerification,
    sendRecoveryEmail,
    confirmRecovery,
    getOAuthRedirect,
    finishOAuthSession,
    getRoles
} = require('../api/auth/logic');

const roleToPath = [
    { label: "admin", path: "/admin" },
    { label: "website managers", path: "/admin" },
    { label: "tutors", path: "/tutor" },
    { label: "recruitment", path: "/recruitment" },
    { label: "students", path: "/student/dashboard" }
];

const pathForRoles = (labels) =>{
    for(const entry of roleToPath){
        if(labels.includes(entry.label)) return entry.path;
    }
    return "/";
};

const setSessionCookie = (res, session) =>{
    res.cookie('appwrite-session', session.secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(session.expire)
    });
};

const signupRoute = async (req, res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        return res.status(400).json("name, email and password are all required");
    }

    const result = await signUp(name, email, password);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

const loginRoute = async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json("email and password are both required");
    }

    const result = await signIn(email, password);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }

    setSessionCookie(res, result);
    const roles = await getRoles(result.userId);
    res.json({ userId: result.userId, redirect: pathForRoles(roles) });
};

const logoutRoute = (req, res) => {
    res.clearCookie('appwrite-session');
    res.json("Logged out!");
};

const sendVerificationRoute = async (req, res) => {
    const sessionSecret = req.cookies['appwrite-session'];
    const { redirectUrl } = req.body;

    if(!sessionSecret){
        return res.status(401).json("You need to be logged in first");
    }
    if(!redirectUrl){
        return res.status(400).json("redirectUrl is required");
    }

    const result = await sendVerificationEmail(sessionSecret, redirectUrl);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

const verifyRoute = async (req, res) => {
    const { userId, secret } = req.query;

    if(!userId || !secret){
        return res.status(400).json("userId and secret are both required");
    }

    const result = await confirmVerification(userId, secret);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

const forgotPasswordRoute = async (req, res) => {
    const { email, redirectUrl } = req.body;

    if(!email || !redirectUrl){
        return res.status(400).json("email and redirectUrl are both required");
    }

    const result = await sendRecoveryEmail(email, redirectUrl);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

const resetPasswordRoute = async (req, res) => {
    const { userId, secret, password } = req.body;

    if(!userId || !secret || !password){
        return res.status(400).json("userId, secret and password are all required");
    }

    const result = await confirmRecovery(userId, secret, password);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

const oauthProviderRoute = async (req, res) => {
    const { provider } = req.params;
    const { successUrl, failureUrl } = req.query;

    if(!successUrl || !failureUrl){
        return res.json("successUrl and failureUrl are both required");
    }

    const redirectUrl = await getOAuthRedirect(provider, successUrl, failureUrl);

    if(redirectUrl.startsWith("http")){
        return res.redirect(redirectUrl);
    }
    res.json(redirectUrl);
};

const oauthProviderSuccessRoute = async (req, res) => {
    const { userId, secret } = req.query;

    if(!userId || !secret){
        return res.json("userId and secret are both required");
    }

    const result = await finishOAuthSession(userId, secret);

    if(typeof result === "string"){
        return res.json(result);
    }

    setSessionCookie(res, result);
    const roles = await getRoles(result.userId);
    res.json({ userId: result.userId, redirect: pathForRoles(roles) });
};

module.exports = (appInstance) => {
    appInstance.post('/auth/signup', signupRoute);
    appInstance.post('/auth/login', loginRoute);
    appInstance.post('/auth/logout', logoutRoute);
    appInstance.post('/auth/send-verification', sendVerificationRoute);
    appInstance.get('/auth/verify', verifyRoute);
    appInstance.post('/auth/forgot-password', forgotPasswordRoute);
    appInstance.post('/auth/reset-password', resetPasswordRoute);
    appInstance.get('/auth/oauth/:provider', oauthProviderRoute);
    appInstance.get('/auth/oauth/:provider/success', oauthProviderSuccessRoute);
};
