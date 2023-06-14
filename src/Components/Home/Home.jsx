import React,{useState,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
//import Image from 'react-bootstrap/esm/Image';
import { getDocs, collection} from "firebase/firestore";
import { db } from "../../firebase"


const Home = () => {
    let navigate = useNavigate()
    const [games, setGames] = useState([])
    
    useEffect(() => {
		async function fetchListings() {
			try {
				// execute the query
                let games = []
                const querySnapshot = await getDocs(collection(db, "game"));
                querySnapshot.forEach((doc) => {
                  // doc.data() is never undefined for query doc snapshots
                  let struct = {
                    ID: doc.id,
                    DATA: doc.data()
                  }
                  games.push(struct)
                });

                setGames(games)
			} catch (error) {
				console.log(error);
			}
		}
		fetchListings();
	}, []);
    return(
        <div>
            <h1>Pick a game</h1>
            <Container>
                <Row>
                    {games.map((game,index)=>(
                        <Col key={index}>
                        <div >
                        <img alt="Game Cover" onClick={()=>{navigate(`/${game.ID}`)}} src={game.DATA.imgUrls[0]} style={{width:"400px"}} />
                        <button onClick={()=>{navigate(`/${game.ID}`)}}>Lets play {game.DATA.name}!!</button>
                        </div>
                        </Col>
                    ))}
                
                </Row>
            </Container>

        </div>
    )
  
  
};

export default Home;