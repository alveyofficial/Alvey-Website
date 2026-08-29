
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

module.exports = { client, db, dbId };
