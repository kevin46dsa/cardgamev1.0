import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Card } from "react-bootstrap";
import PlayerCard from "./PlayerCard";

const PlayerCards = (props) => {
  // const {playerData} = props
  const playerData = [
    {
      name: "Player1",
      word: "Word1",
    },
    {
      name: "Player2",
      word: "Word2",
    },
    {
      name: "Player3",
      word: "Word3",
    },
    {
      name: "Player4",
      word: "Word4",
    },
    {
      name: "Player5",
      word: "Word5",
    },
    {
      name: "Player6",
      word: "Word6",
    },
    {
      name: "Player7",
      word: "Word7",
    },
    {
      name: "Player8",
      word: "Word8",
    },
    {
      name: "Player9",
      word: "Word9",
    },
    {
      name: "Player10",
      word: "Word10",
    },
  ];

  return (
    <div>
      <Container>
        <Row xs={3}>
          {playerData.map((player, index) => {
            return (
              <Col key={index}>
                <Card style={{ width: "18rem" }}>
                  <Card.Body>
                    <Card.Title>{player.name}</Card.Title>
                    <Card.Text>{player.word}</Card.Text>
                    <PlayerCard
                      key={index}
                      name={player.name}
                      word={player.word}
                    />
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
};

export default PlayerCards;
