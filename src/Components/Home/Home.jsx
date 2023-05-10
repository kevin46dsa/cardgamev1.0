import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col  from "react-bootstrap/Col";
const Home = () => {
    let navigate = useNavigate()


    return(
        <div>
            <h1>Pick a game</h1>
            <Container>
                <Row xs={1} sm={1} md={2} lg={3} xl={3} xxl={4}>
                <Col><button onClick={()=>{navigate("/Game-1")}}>Game 1</button></Col>
                <Col>Game 2</Col>
                <Col>Game 3</Col>
                <Col>Game 4</Col>
                </Row>
            </Container>

        </div>
    )
  
  
};

export default Home;