const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../env/.env')});

const { db, dbId, table, Query } = require('../../appwrite');

// Only public, approved reviews are returned here. 

// moderation (approving/rejecting a pending review) is an admin write action and belongs in an admin-only route, not here
const getReviews = async(tutorId) =>{
    try{
        const queries = [
            Query.equal("isPublic", true),
            Query.equal("status", "approved")
        ];
        if(tutorId){
            queries.push(Query.equal("tutorId", tutorId));
        }

        const res = await db.listDocuments(
            dbId,
            table.tutorReviews,
            queries
        );

        return res.documents.map(doc =>({
            id: doc.$id,
            studentName: doc.authorName || "Anonymous Student",
            rating: doc.rating ?? 5,
            comment: doc.body || "",
            createdAt: doc.$createdAt,
            tutorId: doc.tutorId || ""
        }));
    } catch(err){
        console.error("Error Fetching Reviews : "+err.message);
        return [];
    }
};

module.exports = { getReviews };