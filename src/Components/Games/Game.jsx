import React,{useState, useEffect} from 'react';
import {useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/Image'
import { Game1 } from '../../Games';
import "./Game.css"
const Game = ({data}) => {
    let { id } = useParams();
    console.log(data)
    const [randomNumber, setRandomNumber] = useState([])
    const [card, setCard] = useState("Start")


    function getRandomCard(){
        
        console.log("randomcardPicked")
        console.log(randomNumber)
        let item = randomNumber[Math.floor(Math.random()*randomNumber.length)];
        console.log(item)
        setCard(item)
        setRandomNumber(randomNumber.filter((e)=>(e !== item)))
    }
    /*
    useEffect(() => {
        if
		setRandomNumber(...data.imgUrls)
	}, []);
*/
    return(
        <div style={{textAlign: "center"}}>
            <h1>Lets Play {data.name}</h1>
            <div style={{height: "30px" }}></div>
            <Container>
                <Row >
                <Col key={id}>
                {card === "Start" ?  
                <Image  src='https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/table%20no..png?alt=media&token=b25b160c-b5f7-4583-a7a7-e17538383f71' fluid/>
                :
                  <Image src={card} fluid/>}    
                {!card ?  
                <Image  src={"https://cdn.pixabay.com/photo/2020/10/13/07/43/game-5651051_1280.jpg"} fluid/>
                :
                null}
                </Col> 
                </Row>
                <Row>  
                    <Col>
                    <br/>
                <button onClick={()=>getRandomCard()}>Pick Random Card</button>
                </Col>       
                </Row>
            </Container>
        </div>
    )
  
};

export default Game;