// Dotenv Setup
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, './env/.env')});

//Variables
const express = require('express');
const cors = require('cors');
const port = parseInt(process.env.PORT);
const frontend_uri = process.env.FRONTEND_URI;
const { tutors } = require('./api/find-a-tutor');

//CORS Setup and basic setup
const app = express();
app.use(cors({origin: frontend_uri,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Server test request
app.get("/ping", (req,res)=>{
    res.send("Pong!");
});

app.get("/tutor-profiles", async (req,res)=>{
    const tutorsData = await tutors();
    res.json(tutorsData);
}); 

app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}/`);
});
