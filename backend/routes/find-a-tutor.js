const express = require('express');
const router = express.Router();
const { tutors, getTutorBySlug } = require('../api/find-a-tutor/logic');

router.get('/', async(req,res)=>{
    const data = await tutors();
    res.json(data);
});

router.get('/:slug', async(req,res)=>{
    const tutor = await getTutorBySlug(req.params.slug);
    if(!tutor){
        return res.status(404).json("Tutor not found");
    }
    res.json(tutor);
});

module.exports = router;