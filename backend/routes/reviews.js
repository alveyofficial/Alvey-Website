const express = require('express');
const router = express.Router();
const { getReviews } = require('../api/reviews/logic');

router.get('/', async(req,res)=>{
    const reviews = await getReviews(req.query.tutorId);
    res.json(reviews);
});

module.exports = router;