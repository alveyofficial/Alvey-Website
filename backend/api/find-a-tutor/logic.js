const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../env/.env')});

const { db, dbId, table } = require('../../appwrite');

// same slug rule as main branch's data-store.ts mapTutorDoc: a stored
// slug field, else slugify the display name, else fall back to the raw
// document id, so they stay human readable
const nameToSlug = (name) =>{
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const tutors = async() =>{
    try{
        const res = await db.listDocuments(
            dbId,
            table.tutorProfiles
        );
        let data = [];
        for(let i=0; i<=res.documents.length-1; i++){
            let tmp = res.documents[i];
            const name = tmp.displayName || "Certified Tutor";
            const slug = tmp.slug || nameToSlug(name) || tmp.$id;
            data.push({
                id: tmp.$id,
                slug,
                name,
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
    } catch(err){
        console.error("Error Fetching Tutor Profiles : "+err.message);
        return [];
    }
};

// same lookup order as main branch's getTutorBySlug: match by slug first,
// then fall back to matching the raw tutor id, since old links or bad data might still use the id instead of a slug
const getTutorBySlug = async(slug) =>{
    try{
        const allTutors = await tutors();
        return allTutors.find(t => t.slug === slug) || allTutors.find(t => t.id === slug) || null;
    } catch(err){
        console.error("Error Fetching Tutor By Slug : "+err.message);
        return null;
    }
};

module.exports = { tutors, getTutorBySlug };