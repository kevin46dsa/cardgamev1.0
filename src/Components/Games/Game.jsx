import React,{useState, useEffect } from 'react';
import {useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import { doc,getDoc} from "firebase/firestore";
import { db } from "../../firebase"
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/Image'
import { Button } from 'react-bootstrap';
import { Card, Modal } from 'react-bootstrap';
//import { Game1 } from '../../Games';
import "./Game.css"
const Game = () => {
    let { id } = useParams();
    const [newCard, setNewCard] = useState("")
    const [card, setCard] = useState([])
    const [Data, setData] = useState([])
    const [displayRules, setDisplayRules] = useState(false)
    

    function getRandomCard(allCards){
            
            if(allCards.length === 0) setNewCard('https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/For%20playing.png?alt=media&token=3b339ad5-8d8d-49f9-bc7b-8004c84502d0')
            else{
                const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                let index = allCards.indexOf(randomCard)
                allCards.splice(index, 1);
                setNewCard(randomCard);
            }
            
    }
    
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

useEffect(() => {
    async function fetchListings() {
        try {
            // execute the query
            
            const docRef =  doc(db, "game", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const gameData = docSnap.data()
                console.log(gameData)
                setCard(gameData.Cards)
                setData(gameData)
                if(gameData.rules.length !== 0) setDisplayRules(true)
                //setNewCard("https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/kevin%20dsa-dd337f33eb3eaf4215b033c33f0da0fc-uncropped_scaled_within_1536_1152.webp?alt=media&token=1d710eca-bbfc-499e-b81e-f2a4f3ab1b9a");
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
let startCard = undefined
switch(id) {
    case '6vfbnEVnnoheLfGLABKk':
        startCard = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Cover.%20ylyl.png?alt=media&token=8b98d9a7-f8c0-4ae7-b1b3-a17b4e14afbe"
      break;
    case 'NSrETKaJwGjZVSdejuMf':
        startCard = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Screenshot%202023-08-07%20at%2011.59.46%20PM.png?alt=media&token=16206bf9-9138-4aac-9c2b-b109509a3822"
      break;
    case 'Addgameid':
        startCard = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Cover.%20ylyl.png?alt=media&token=8b98d9a7-f8c0-4ae7-b1b3-a17b4e14afbe"
      break;  
    default:
      console.log("Default")
  }



    return(
        <div style={{textAlign: "center"}}>
            <h1>Lets Play {Data.name}</h1>
            {displayRules ? <Button onClick={handleShow}>Rules</Button>: null}
            
            <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Data.name} Rules</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Image
            className="d-block w-100"
            src={Data.rules}
            alt='Rules'/>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
            <div style={{height: "30px" }}></div>
            <Container>
                <Row >
                <Col key={id}>
               
                <Card >

                {newCard === ""?  
                <Card.Img src={startCard} />
                :
                <Card.Img src={newCard} key={newCard}/>
                }
                
                
                <Card.Body>
                <Button onClick={()=>getRandomCard(card)}>Pick Random Card</Button>
                </Card.Body>
                </Card>
               
                </Col> 
                </Row>
            </Container>
        </div>
    )
  
};

export default Game;