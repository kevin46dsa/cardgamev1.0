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
            <br/>
            <br/>
            <br/>
            
            <h1 style={{textAlign: "center"}}>Pick a game</h1>
            <br/>
            <br/>
            <Container>
                <Row>
                    {games.map((game,index)=>(
                        <Col key={index}>
                        <div >

                        <img alt="Game Cover" onClick={()=>{navigate(`/${game.ID}`)}} src={game.DATA.imgUrls[0]} style={{width:"400px"}} />
                        <button style={{textAlign: "center"}} onClick={()=>{navigate(`/${game.ID}`)}}>Lets play {game.DATA.name}!!</button>
                        <br/>
                        <br/>
                        </div>
                        </Col>
                        
                    ))}
                
                </Row>
            </Container>
            <style >{`
          .truthor-dare-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
  
          .button-container {
            display: flex;
            justify-content: center;
            margin-top: 20px;
          }
  
          button {
            margin: 10px;
            padding: 10px 20px;
            font-size: 18px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
  
          @media (max-width: 480px) {
            h1 {
              font-size: 24px;
            }
  
            button {
              font-size: 16px;
              padding: 8px 16px;
            }
          }
        `}</style>
        </div>
    )
  
  
};

export default Home;