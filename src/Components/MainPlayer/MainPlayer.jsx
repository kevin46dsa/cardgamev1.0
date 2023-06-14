import React,{useState,useEffect} from 'react';
import { useNavigate , useParams} from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/esm/Image';
import { getDocs, collection, doc,getDoc} from "firebase/firestore";
import { db } from "../../firebase"
import Game from '../Games/Game';
import TruthorDare from '../Truthordare/Truthordare';

const MainPlayer = () => {

    let {id} = useParams()
    let games = undefined
    useEffect(() => {
		async function fetchListings() {
			try {
				// execute the query
                
                const docRef =  doc(db, "game", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("Document data:", docSnap.data());
                    games = docSnap.data()
                  } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                  }
			} catch (error) {
				console.log(error);
			}
		}
		fetchListings();
	}, []);


    return(
        <div>
            {id === 'TruthorDare' ? <TruthorDare data={games}/> :<Game data={games}/>}
            
        </div>
    )
  
  
};

export default MainPlayer;