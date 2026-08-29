
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, './env/.env')});

const { Client, Databases } = require('node-appwrite');


const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_ID)
    .setKey(process.env.APPWRITE_KEY);

const db = new Databases(client);

const dbId = process.env.APPWRITE_DB;

//Not all ids but some
const table = {
    tutorProfiles:'tutor_profiles',
    recruitmentApps: 'volunteer_applications',
    tutorReviews: 'tutor_reviews',
    schedules: 'schedules',
    students: 'students',
    tutorApplications: 'tutor_applications',
    users: 'users',
    credits: 'credits'
};

module.exports = { client, db, dbId, table };
