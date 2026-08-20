import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Card } from "react-bootstrap";
import { useGameData } from "../../hooks/useGameData";
import { useCardPool } from "../../hooks/useCardPool";
import RulesModal from "../RulesModal/RulesModal";
import "./Game.css";

const PLACEHOLDER_CARD =
  "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/For%20playing.png?alt=media&token=3b339ad5-8d8d-49f9-bc7b-8004c84502d0";

// Legacy games whose cover art predates storing it on the game document itself.
const LEGACY_START_CARDS = {
  NSrETKaJwGjZVSdejuMf:
    "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Screenshot%202023-08-07%20at%2011.59.46%20PM.png?alt=media&token=16206bf9-9138-4aac-9c2b-b109509a3822",
  Addgameid:
    "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/Cover.%20ylyl.png?alt=media&token=8b98d9a7-f8c0-4ae7-b1b3-a17b4e14afbe",
};

const Game = () => {
  const { id } = useParams();
  const { data } = useGameData("game", id);
  const { draw } = useCardPool(data?.Cards);
  const [currentCard, setCurrentCard] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const hasRules = Boolean(data?.rules?.length);
  const startCard = LEGACY_START_CARDS[id] ?? data?.imgUrls?.[0];

  const handlePickCard = () => {
    setCurrentCard(draw() ?? PLACEHOLDER_CARD);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Lets Play {data?.name}</h1>
      {hasRules && <Button onClick={() => setShowRules(true)}>Rules</Button>}

      <RulesModal
        show={showRules}
        onHide={() => setShowRules(false)}
        title={`${data?.name} Rules`}
        imageSrc={data?.rules}
      />

      <div style={{ height: "30px" }}></div>
      <Container>
        <Row>
          <Col key={id}>
            <Card>
              <Card.Img src={currentCard ?? startCard} key={currentCard} />
              <Card.Body>
                <Button onClick={handlePickCard}>Pick Random Card</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Game;
