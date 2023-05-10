import React,{useState} from 'react';
import {useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/Image'
import { Game1 } from '../../Games';
const Game = () => {
    let { id } = useParams();

    const [randomNumber, setRandomNumber] = useState(Game1)
    const [card, setCard] = useState(Game1[0])


    function getRandomCard(){
        console.log("randomcardPicked")
        
        let  item = randomNumber[Math.floor(Math.random()*randomNumber.length)];
        console.log(item)
        setCard(item)
        setRandomNumber(randomNumber.filter((e)=>(e !== item)))
    }

    return(
        <div>
            <h1>{id}</h1>
            <Container>
                <Row xs={1} sm={1} md={2} lg={3} xl={3} xxl={4}>
                <Col key={id}>
                {!card ?  <Image  src={"https://cdn.pixabay.com/photo/2020/10/13/07/43/game-5651051_1280.jpg"}/>:
                <Image src={randomNumber}/>}
                
                <button onClick={()=>getRandomCard()}>Pick Random Card</button></Col>
                </Row>
            </Container>

        </div>
    )
  
};

export default Game;