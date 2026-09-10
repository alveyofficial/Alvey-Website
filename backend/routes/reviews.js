const { getReviews } = require('../api/reviews/logic');

const reviewsGetRoute = async(req,res)=>{
    const reviews = await getReviews(req.query.tutorId);
    res.json(reviews);
};

module.exports = (appInstance) => {
    appInstance.get('/reviews', reviewsGetRoute);
};
