import React,{useState,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import {Button} from 'react-bootstrap';
import { Card } from 'react-bootstrap';
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
            
            <h1 style={{textAlign: "center",fontWeight : 'bold'}}>Pick A Game</h1>
            <br/>
            <br/>
            <Container >
                <Row xs={1} sm={1} md={1} lg={2}>
                    {games.map((game,index)=>(
                        <Col key={index} >
                        <Card style={{margin: "20px"}}>
                        
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/${game.ID}`)}} src={game.DATA.imgUrls[0]} style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/${game.ID}`)}}>Lets play {game.DATA.name}!!</Button>
                        </Card.Body>
                        
                        
                        </Card>
                        </Col>
                        
                    ))}
                
                </Row>
            </Container>
           
        </div>
    )
  
  
};

export default Home;