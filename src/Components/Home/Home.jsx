import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
import Image from 'react-bootstrap/esm/Image';
const Home = () => {
    let navigate = useNavigate()


    return(
        <div>
            <h1>Pick a game</h1>
            <Container>
                <Row xs={1} sm={1} md={2} lg={3} xl={3} xxl={4}>
                <Col>
                <div>
                <Image onClick={()=>{navigate("/Game-1")}} src='https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/table%20no..png?alt=media&token=b25b160c-b5f7-4583-a7a7-e17538383f71'/>
                <button onClick={()=>{navigate("/Game-1")}}>Game 1</button>
                </div>
                </Col>
                </Row>
            </Container>

        </div>
    )
  
  
};

export default Home;