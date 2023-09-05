import React,{useState, useEffect } from 'react';
import {useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import { doc,getDocs,getDoc,collection, } from "firebase/firestore";
import { db } from "../../firebase"
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/Image'
import { Button } from 'react-bootstrap';
import { Card, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Truthordrinkrandomplayer = () => {
    let { id } = useParams();
    const [newCard, setNewCard] = useState("")
    let defaultTwistCardCover = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Screenshot%202023-09-03%20at%205.36.50%20PM.png?alt=media&token=4ef85496-dc84-4168-82a4-ed47749097d8"
    const [newtwistCard1, setnewtwistCard1] = useState(defaultTwistCardCover)
    const [newtwistCard2, setnewtwistCard2] = useState(defaultTwistCardCover)
    const [newtwistCard3, setnewtwistCard3] = useState(defaultTwistCardCover)
    const [newtwistCard4, setnewtwistCard4] = useState(defaultTwistCardCover)
    const [card, setCard] = useState([])
    const [twistAllCards, settwistAllCards] = useState([])
    const [displayRules, setDisplayRules] = useState(false)
    let navigate = useNavigate()


    function getRandomCard(allCards,id){
            if(id === 0){
                if(allCards.length === 0) setNewCard('https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/For%20playing.png?alt=media&token=3b339ad5-8d8d-49f9-bc7b-8004c84502d0')
                else{
                    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                    let index = allCards.indexOf(randomCard)
                    allCards.splice(index, 1);
                    setNewCard(randomCard);
                }
            }
            else{
                const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                let index = allCards.indexOf(randomCard)
                allCards.splice(index, 1);
                switch(id) {
                    case 1 :
                        setnewtwistCard1(randomCard)
                      break;
                    case 2:
                        setnewtwistCard2(randomCard)
                      break;
                    case 3:
                        setnewtwistCard3(randomCard)
                      break;  
                    case 4:
                        setnewtwistCard4(randomCard)
                      break; 
                    default:
                        startCard = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Screenshot%202023-09-03%20at%205.25.55%20PM.png?alt=media&token=af530ab5-8232-450c-836e-24c393680379"
                  }
            }
            
            
    }
    
    const [show, setShow] = useState(false);
    const [showTwist, setShowTwist] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
    async function fetchListings() {
        try {
            // execute the query
            let allCards = []
               
                const querySnapshot = await getDocs(collection(db, "truthordrink"));
                querySnapshot.forEach((doc) => {
                    if(doc.id !== "twistcards"){
                        let DocData = doc.data()
                        allCards = [...allCards, ...DocData.Cards ]
                    }
                });
                console.log(allCards)
                setCard(allCards)
            

            const docRef2 =  doc(db, "truthordrink", "twistcards");
            const docSnap2 = await getDoc(docRef2);
              if (docSnap2.exists()) {
                const Twistcards = docSnap2.data()
                settwistAllCards(Twistcards.Cards)
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

let startCard = "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Screenshot%202023-09-03%20at%205.25.55%20PM.png?alt=media&token=af530ab5-8232-450c-836e-24c393680379"



    return(
        <div style={{textAlign: "center"}}>
            {displayRules ? <Button onClick={handleShow}>Rules</Button>: null}
            <Button onClick={()=>{setShowTwist(true)}}>Add a Twist</Button>
            <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Truth or Drink Rules</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Image
            className="d-block w-100"
            src="insert Rules image url"
            alt='Rules'/>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showTwist} onHide={()=>{
        setShowTwist(false)  
        setnewtwistCard1(defaultTwistCardCover)
        setnewtwistCard2(defaultTwistCardCover)
        setnewtwistCard3(defaultTwistCardCover)
        setnewtwistCard4(defaultTwistCardCover)}}>
        <Modal.Header closeButton>
          <Modal.Title>Add a twist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Container >
                <Row xs={1} sm={1} md={1} lg={2}>
                    
                        <Col key={"1"}>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>getRandomCard(twistAllCards,1)} src={newtwistCard1} style={{height:"300px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>getRandomCard(twistAllCards,1)}>Show</Button>
                        </Card.Body>
                        </Card>
                        </Col>
                        <Col key={"2"}>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>getRandomCard(twistAllCards,2)} src={newtwistCard2} style={{height:"300px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>getRandomCard(twistAllCards,2)}>Show</Button>
                        </Card.Body>
                        </Card>
                        </Col>
                        <Col key={"3"}>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>getRandomCard(twistAllCards,3)} src={newtwistCard3} style={{height:"300px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>getRandomCard(twistAllCards,3)}>Show</Button>
                        </Card.Body>
                        </Card>
                        </Col>
                        <Col key={"4"}>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>getRandomCard(twistAllCards,4)} src={newtwistCard4} style={{height:"300px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>getRandomCard(twistAllCards,4)}>Show</Button>
                        </Card.Body>
                        </Card>
                        </Col>
                        </Row>
                        </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>{
        setShowTwist(false)  
        setnewtwistCard1(defaultTwistCardCover)
        setnewtwistCard2(defaultTwistCardCover)
        setnewtwistCard3(defaultTwistCardCover)
        setnewtwistCard4(defaultTwistCardCover)}}>
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
                <Button onClick={()=>getRandomCard(card,0)}>Pick Random Card</Button>
                </Card.Body>
                </Card>
               
                </Col> 
                </Row>
            </Container>
        </div>
    )
  
};

export default Truthordrinkrandomplayer;