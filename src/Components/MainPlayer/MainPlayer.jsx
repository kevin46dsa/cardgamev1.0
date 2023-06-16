import React,{useEffect, useRef} from 'react';
import { useParams} from 'react-router-dom';

import {  doc,getDoc} from "firebase/firestore";
import { db } from "../../firebase"
import Game from '../Games/Game';
import TruthorDare from '../Truthordare/Truthordare';
import NeverHave from '../NeverHave/NeverHave';
import ChatGPT from '../ChatGPT/ChatGPT';

const MainPlayer = () => {
    
    let {id} = useParams()
    const dataRef = useRef()
   
    useEffect(() => {
		async function fetchListings() {
			try {
				// execute the query
                
                const docRef =  doc(db, "game", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("Document data:", docSnap.data());
                    dataRef.current = docSnap.data()
                 
                  } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                  }
			} catch (error) {
				console.log(error);
			}
		}
		fetchListings();
	}, [id]);


    return(
        <div style={{padding: "50px"}}> 
            {(() =>{
                switch (id) {
                    case 'TruthorDare':
                        return (<TruthorDare />)
                    case "Neverhaveiever":
                        return (<NeverHave/>)
                    case "ChatGPT":
                        return (<ChatGPT/>)
                    default:
                        return (<Game data={dataRef.current}/>)
            }})()}
        </div>
    )
  
  
};

export default MainPlayer;