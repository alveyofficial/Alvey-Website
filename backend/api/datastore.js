const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../env/.env')});


const { client, db, dbId, table, ID } = require('../appwrite');
const { Query, Users } = require('node-appwrite');

const { tutors } = require('./find-a-tutor');

class DatastoreSkeleton{
    constructor(db, dbId, table, client){
        this.db = db;
        this.dbId = dbId;
        this.table = table;
        this.client = client;
    }

    async newDocument(
        collectionId,
        name,
        data
    ){
        return await db.createDocument(
            this.dbId,
            collectionId,
            ID.unique(),
            { name, data }
        );
    }

    async fetchDocument(
        collectionId,
        query
    ){
        return ((await db.listDocuments(
            this.dbId,
            collectionId,
            query
        )) || []);
    }

    async fetchAuthUsers(){
        const users = new Users(this.client);
        return await users.list();
    }
}

class Datastore extends DatastoreSkeleton{
    async getSubjectCategories() {
    try {
        const res = await this.fetchDocument(
            this.table.subjectCategories,
            [
                Query.equal("active", true),
                Query.orderAsc("displayOrder")
            ]
        );

        if (res.documents.length > 0) return res.documents;
    } catch (error) { 
        // This will print the EXACT database problem in your terminal console
        console.error("Appwrite Database Error:", error.message || error); 
        return []; 
    }  
    return [];
}

    async getHomepageStats(){
        const tutorData = await tutors();
        //Fetch user count
        const members = await this.fetchAuthUsers();
        const subjectSet = new Set();
        tutorData.forEach(tutor=>{
            (tutor.subjects || []).map(subj=>subjectSet.add(subj))
        });
        const rated = tutorData.filter(tutor => typeof tutor.rating === "number");
        const rating  = rated.length > 0 ? rated.reduce((sum, tutor)=>sum + tutor.rating, 0) / rated.length : 0;

        return {
            tutors : tutorData.length,
            members : members.total,
            subjects : subjectSet.size,
            rating : Number(rating.toFixed(1))
        }

    }
}

const datastore = new Datastore(db, dbId, table, client);

module.exports = { datastore };
