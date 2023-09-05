import React,{useState,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import {Button} from 'react-bootstrap';
import { Card } from 'react-bootstrap';

function Truthordrink()  {
  let navigate = useNavigate()

    return (
        <div className="truthor-dare-container">
         <br/>
            <br/>
            <br/>
            
            <h1 style={{textAlign: "center",fontWeight : 'bold'}}>Truth or Drink</h1>
            <br/>
            <br/>
            <Container >
                <Row xs={1} sm={1} md={1} lg={2}>
                    
                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/3VYgpS7VAfD86qrsOT9W`)}} src="https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/cover%20pictures%201.png?alt=media&token=0b4a5838-02ec-4014-b8e2-0096bdc77c07" style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/3VYgpS7VAfD86qrsOT9W`)}}>Lets play On The Rocks!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/axjXX9veP0KzvOZKJMSn`)}} src="https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/cover%20pictures%202.png?alt=media&token=4da26d53-155e-4796-b7d9-54d6681226d1" style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate('/truthordrink/axjXX9veP0KzvOZKJMSn')}}>Lets play Last Call!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col >
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/cF3CqSjUmMTVO5sBFNzo`)}} src="https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/cover%20pictures%204.png?alt=media&token=26be0988-a9ac-4aac-980e-14706b5a3dc7" style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/cF3CqSjUmMTVO5sBFNzo`)}}>Lets play Extra Dirty!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/Eg6tVYEv769y7JcMcOnr`)}} src="https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/cover%20pictures%203.png?alt=media&token=6437c20a-cd71-4095-8e80-3257a6163852" style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/Eg6tVYEv769y7JcMcOnr`)}}>Lets play Happy Hour!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrinkrandom`)}} src="https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/cover%20picture%20al.png?alt=media&token=c73f2a94-8aaf-4422-9525-82db3c36545f" style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrinkrandom`)}}>Generate Random!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                </Row>
            </Container>
         </div>
      );
    };
    
export default Truthordrink;
