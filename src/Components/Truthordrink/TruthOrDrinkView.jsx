import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Card, Modal } from "react-bootstrap";
import RulesModal from "../RulesModal/RulesModal";
import { useCardPool } from "../../hooks/useCardPool";
import { useTruthOrDrinkDeck } from "./useTruthOrDrinkDeck";
import { s3Url } from "../../Utils/s3";

const NO_CARD_PICKED_YET = s3Url("utility", "Screenshot 2023-09-03 at 5.25.55 PM.png");
const NO_MORE_CARDS = s3Url("utility", "For playing.png");
const DEFAULT_TWIST_COVER = s3Url("utility", "Screenshot 2023-09-03 at 5.36.50 PM.png");
const RANDOM_MODE_RULES_IMAGE = s3Url("utility", "Screenshot 2023-09-04 at 9.20.24 PM.png");

const TWIST_SLOTS = [0, 1, 2, 3];

/**
 * Shared player screen for both the single-deck ("On The Rocks", etc.) and
 * shuffled-random Truth or Drink modes. Previously ~220 near-identical lines
 * were copy-pasted across Truthordrinkplayer.jsx and Truthordrinkrandom.jsx.
 */
const TruthOrDrinkView = ({ mode, id }) => {
  const { loading, name, cards, rules, displayRules, twistCards } = useTruthOrDrinkDeck(mode, id);
  const { draw: drawMain } = useCardPool(cards);
  const { draw: drawTwist } = useCardPool(twistCards);

  const [currentCard, setCurrentCard] = useState(null);
  const [twistSlots, setTwistSlots] = useState(TWIST_SLOTS.map(() => DEFAULT_TWIST_COVER));
  const [showRules, setShowRules] = useState(false);
  const [showTwist, setShowTwist] = useState(false);

  const closeTwist = () => {
    setShowTwist(false);
    setTwistSlots(TWIST_SLOTS.map(() => DEFAULT_TWIST_COVER));
  };

  const pickMainCard = () => setCurrentCard(drawMain() ?? NO_MORE_CARDS);

  const pickTwistCard = (slotIndex) => {
    const card = drawTwist();
    if (!card) return;
    setTwistSlots((prev) => prev.map((c, i) => (i === slotIndex ? card : c)));
  };

  const rulesTitle = mode === "random" ? "Truth or Drink Rules" : `${name} Rules`;
  const rulesImage = mode === "random" ? RANDOM_MODE_RULES_IMAGE : rules;

  return (
    <div style={{ textAlign: "center" }}>
      {mode === "single" && <h1>Lets Play {name}</h1>}
      {displayRules && !loading && <Button onClick={() => setShowRules(true)}>Rules</Button>}
      <Button onClick={() => setShowTwist(true)}>Add a Twist</Button>

      <RulesModal show={showRules} onHide={() => setShowRules(false)} title={rulesTitle} imageSrc={rulesImage} />

      <Modal show={showTwist} onHide={closeTwist}>
        <Modal.Header closeButton>
          <Modal.Title>Add a twist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row xs={1} sm={1} md={1} lg={2}>
              {TWIST_SLOTS.map((slotIndex) => (
                <Col key={slotIndex}>
                  <Card style={{ margin: "20px" }}>
                    <Card.Img
                      alt="Twist card"
                      onClick={() => pickTwistCard(slotIndex)}
                      src={twistSlots[slotIndex]}
                      style={{ height: "300px" }}
                    />
                    <Card.Body style={{ textAlign: "center" }}>
                      <Button size="lg" onClick={() => pickTwistCard(slotIndex)}>
                        Show
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeTwist}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <div style={{ height: "30px" }}></div>
      <Container>
        <Row>
          <Col>
            <Card>
              <Card.Img src={currentCard ?? NO_CARD_PICKED_YET} key={currentCard} />
              <Card.Body>
                <Button onClick={pickMainCard}>Pick Random Card</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TruthOrDrinkView;
