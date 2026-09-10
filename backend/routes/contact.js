const { sendContactMessage } = require('../api/contact/logic');

const contactSubmitRoute = async(req,res)=>{
    const { name, email, message } = req.body;

    if(!name || !email || !message){
        return res.status(400).json("name, email and message are all required");
    }

    const result = await sendContactMessage(name, email, message);

    if(typeof result === "string"){
        return res.status(400).json(result);
    }
    res.json(result);
};

module.exports = (appInstance) => {
    appInstance.post('/contact', contactSubmitRoute);
};

