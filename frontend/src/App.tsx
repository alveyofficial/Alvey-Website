import './App.css';
import { Routes, Route } from 'react-router-dom';

//Pages and Components
import Home from './pages/Home/Home';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import Navbar from './components/Navbar/Navbar';
import FindTutor from './pages/FindTutor/FindTutor';
import Apply from './pages/Apply/Apply';
import WorkWithUs from './pages/WorkWithUs/WorkWithUs';
import Contact from './pages/Contact/Contact';
import TutorsLoading from './pages/Tutors/TutorsLoading';
import Tutors from './pages/Tutors/Tutors';
import AdminLayout from './pages/Admin/AdminLayout';
import LandingPage from './pages/Admin/LandingPage/LandingPage';
import AIAssistant from './pages/Admin/AIAssistant/AIAssistant';
import Advertisement from './pages/Admin/Advertisement/Advertisement';
import Analytics from './pages/Admin/Analytics/Analytics';
import ArchivedTutorsApp from './pages/Admin/ArchivedTutorsApp/ArchivedTutorsApp';
import ArchivedRecruitmentApps from './pages/Admin/ArchivedRecruitmentApps/ArchivedRecruitmentApps';
import Homepage from './pages/Admin/Homepage/Homepage';
import Notifications from './pages/Admin/Notifications/Notifications';
import Pages from './pages/Admin/Pages/Pages';
import RecruitmentApps from './pages/Admin/RecruitmentApps/RecruitmentApps';
import Reviews from './pages/Admin/Reviews/Reviews';
import Scheduling from './pages/Admin/Scheduling/Scheduling';
import Settings from './pages/Admin/Settings/Settings';
import TutorApplications from './pages/Admin/TutorApplications/TutorApplications';
import Students from './pages/Admin/Students/Students';


export default function App(){
    return(
        <>
            <Navbar/>
            <Routes>
                <Route path='/' element={<Home/>}/>
                <Route path='home' element={<Home/>}/>
                <Route path='*' element={<ErrorPage/>}/>
                <Route path='find-a-tutor' element={<FindTutor/>}/>
                <Route path='apply' element={<Apply/>}/>
                <Route path='work-with-us' element={<WorkWithUs/>}/>
                <Route path='contact' element={<Contact/>}/>
                <Route path='tutors' element={<TutorsLoading/>}>
                    {/*Redirect link*/}
                    <Route index element={<FindTutor/>}/>
                    <Route path=":id" element={<Tutors/>}/>
                </Route>
                <Route path='admin' element={<AdminLayout/>}>
                    <Route index element={<LandingPage/>}/>
                    {/*Sub-routes for admin*/}
                    <Route path='ai-assistant' element={<AIAssistant/>}/>
                    <Route path='advertisements' element={<Advertisement/>}/>
                    <Route path='analytics' element={<Analytics/>}/>
                    <Route path='tutor-applications-archived' element={<ArchivedTutorsApp/>}/>
                    <Route path='recruitment-applications-archived' element={<ArchivedRecruitmentApps/>}/>
                    <Route path='homepage' element={<Homepage/>}/>
                    <Route path='notifications' element={<Notifications/>}/>
                    <Route path='pages' element={<Pages/>}/>
                    <Route path='recruitment-applications' element={<RecruitmentApps/>}/>
                    <Route path='reviews' element={<Reviews/>}/>
                    <Route path='scheduling' element={<Scheduling/>}/>
                    <Route path='settings' element={<Settings/>}/>
                    <Route path='tutor-applications' element={<TutorApplications/>}/>
                    <Route path='tutors' element={<Tutors/>}/>
                    <Route path='students' element={<Students/>}/>
                </Route> 
            </Routes>
        </>
    );
}
