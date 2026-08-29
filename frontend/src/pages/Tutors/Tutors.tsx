import { useParams } from 'react-router';
import './Tutors.css';

export default function Tutors(){
    //To support Multi-path links like /tutors/1ssj229s
    //where next path '/1ssj229s' is id 
    //id could be tutor's name...
    
    const { id:pathId } = useParams();
    console.log(pathId);

    return(
        <>
            <h1>This is Tutor with path Id : {pathId}</h1>
        </>
    );
}
