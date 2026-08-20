import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import {Button} from 'react-bootstrap';
import { Card } from 'react-bootstrap';
import { s3Url } from '../../Utils/s3';

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
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/3VYgpS7VAfD86qrsOT9W`)}} src={s3Url("utility", "cover pictures 1.png")} style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/3VYgpS7VAfD86qrsOT9W`)}}>Lets play On The Rocks!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/axjXX9veP0KzvOZKJMSn`)}} src={s3Url("utility", "cover pictures 2.png")} style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate('/truthordrink/axjXX9veP0KzvOZKJMSn')}}>Lets play Last Call!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col >
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/cF3CqSjUmMTVO5sBFNzo`)}} src={s3Url("utility", "cover pictures 4.png")} style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/cF3CqSjUmMTVO5sBFNzo`)}}>Lets play Extra Dirty!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrink/Eg6tVYEv769y7JcMcOnr`)}} src={s3Url("utility", "cover pictures 3.png")} style={{height:"400px"}}/>
                        <Card.Body style={{textAlign: "center"}}>
                        <Button size='lg' onClick={()=>{navigate(`/truthordrink/Eg6tVYEv769y7JcMcOnr`)}}>Lets play Happy Hour!!</Button>
                        </Card.Body>
                        </Card>
                        </Col>

                        <Col>
                        <Card style={{margin: "20px"}}>
                        <Card.Img alt="Game Cover" onClick={()=>{navigate(`/truthordrinkrandom`)}} src={s3Url("utility", "cover picture al.png")} style={{height:"400px"}}/>
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
