const { tutors, getTutorBySlug } = require('../api/find-a-tutor/logic');

const findATutorListRoute = async(req,res)=>{
    const data = await tutors();
    res.json(data);
};

const findATutorBySlugRoute = async(req,res)=>{
    const tutor = await getTutorBySlug(req.params.slug);
    if(!tutor){
        return res.status(404).json("Tutor not found");
    }
    res.json(tutor);
};

module.exports = (appInstance) => {
    appInstance.get('/find-a-tutor', findATutorListRoute);
    appInstance.get('/find-a-tutor/:slug', findATutorBySlugRoute);
};
