
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../env/.env')});


const { client, db, dbId, table } = require('../appwrite');

const tutors = async() =>{
    try{
        const res = await db.listDocuments(
            dbId,
            table.tutorProfiles //this is the tableId
        );
        let data = [];
        //Cleaning up tutor data
        for(let i=0; i<=res.documents.length-1; i++){
            let tmp = res.documents[i]; //Tutor Data
            data.push({
                id: tmp.$id,
                name: tmp.displayName,
                shortBio: tmp.shortBio,
                fullBio: tmp.fullBio,
                initials: tmp.avatarInitials,
                education: tmp.education,
                subjects: tmp.subjects,
                levels: tmp.levels,
                languages: tmp.languages,
                badges: tmp.publicBadges,
                responseTime: tmp.responseTime,
                experience: tmp.experienceYears,
                hourlyRate: tmp.hourlyRate,
                availability: tmp.availability,
                active: tmp.active,
                rating: tmp.rating,
                featured: tmp.featured,
                reviewCount: tmp.reviewCount,
                avatarUrl: tmp.avatarUrl
            })
        }
        return data;
        //return res.documents;
    } catch(err){
        console.log("Error Fetching Tutor Profiles : "+err.message);
        return "Could not fetch tutor profiles :(";
    }
};

module.exports = { tutors };
