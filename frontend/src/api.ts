import axios, { isAxiosError } from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export class Router {
    url: string;
    
    constructor(url: string = apiUrl) { 
        this.url = url;
    }
    
    async getTutors() { 
        try {
            const res = await axios.get(`${this.url}/find-a-tutor`);
            return res.data;
        } catch (err) {
            if (isAxiosError(err)) { 
                console.error("API Error :", err.response?.status, err.message);
            } else if (err instanceof Error) {
                console.error("Failed to get tutors :", err.message);
            }
            return [];
        }
    }

    async getHomepageStats() {
        try {
            const res = await axios.get(`${this.url}/datastore/homepage-stats`);
            return res.data;
        } catch (err) {
            if (isAxiosError(err)) { 
                console.error("API Error :", err.response?.status, err.message);
            } else if (err instanceof Error) {
                console.error("Failed to fetch stats :", err.message);
            }
            return null;
        }
    }

    async getSubjectCategories() {
        try {
            const res = await axios.get(`${this.url}/datastore/subject-categories`);
            return res.data;
        } catch (err) {
            if (isAxiosError(err)) { 
                console.error("API Error :", err.response?.status, err.message);
            } else if (err instanceof Error) {
                console.error("Failed to fetch categories :", err.message);
            }
            return [];
        }
    }
}
