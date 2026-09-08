// Dotenv Setup
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, './env/.env')});

//Variables
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const port = parseInt(process.env.PORT);
const frontend_uri = process.env.FRONTEND_URI;
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const findATutorRoutes = require('./routes/find-a-tutor');
const reviewsRoutes = require('./routes/reviews');
const { datastore } = require('./api/datastore');

//CORS Setup and basic setup
//credentials:true is needed or the browser wont send/keep the session cookie
const app = express();
app.use(cors({origin: frontend_uri,
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match', 'If-Modified-Since']}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/contact', contactRoutes);
app.use('/find-a-tutor', findATutorRoutes);
app.use('/reviews', reviewsRoutes);

//Server test request
app.get("/ping", (req,res)=>{
    res.send("Pong!");
});

app.get("/datastore/subject-categories", async (req,res) => {
    const subjCategories = await datastore.getSubjectCategories();
    res.json(subjCategories);
});

app.get("/datastore/homepage-stats", async (req,res) => {
    const stats = await datastore.getHomepageStats()
    res.json(stats);
});

app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}/`);
});