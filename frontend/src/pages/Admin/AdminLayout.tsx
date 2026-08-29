//Manages the nested-routing for admin page

import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout(){
    const pages = [
        { name:"Home", link:"" },
        { name:"Students", link:"students" },  
        { name:"Tutors", link:"tutors" },  
        { name:"Tutor Applications", link:"tutor-applications" },  
        { name:"Archived Tutor Apps", link:"tutor-applications-archived" },  
        { name:"Recruitment Applications", link:"recruitment-applications" },  
        { name:"Archived Recruitment Apps", link:"recruitment-applications-archived" }, 
        { name:"Advertisements", link:"advertisements" },  
        { name:"Reviews", link:"reviews" },  
        { name:"Scheduling", link:"scheduling" },  
        { name:"Notifications", link:"notifications" },  
        { name:"Pages", link:"pages" },  
        { name:"Homepage", link:"homepage" },  
        { name:"AI Assistant", link:"ai-assistant" },  
        { name:"Analytics", link:"analytics" },  
        { name:"Settings", link:"settings" },  
    ];

    return(
        <>
            {/*Test Sidebar*/}
            <nav>
                <ul>
                    {pages.map((page,key)=>(
                        <li key={key}><Link to={page.link}>{page.name}</Link></li>
                    ))}
                </ul>
            </nav>

            <Outlet/>
        </>
    );
}
