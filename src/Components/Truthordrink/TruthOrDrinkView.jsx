import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import RulesModal from "../RulesModal/RulesModal";
import { useCardPool } from "../../hooks/useCardPool";
import { useTruthOrDrinkDeck } from "./useTruthOrDrinkDeck";
import { s3Url } from "../../Utils/s3";
import "./TruthOrDrinkView.css";

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
    <div className="td-page">
      {mode === "single" && <h1 className="td-title">Let's Play {name}</h1>}
      <div className="td-actions">
        {displayRules && !loading && (
          <Button className="td-button pressable" onClick={() => setShowRules(true)}>
            Rules
          </Button>
        )}
        <Button className="td-button pressable" onClick={() => setShowTwist(true)}>
          Add a Twist
        </Button>
      </div>

      <RulesModal show={showRules} onHide={() => setShowRules(false)} title={rulesTitle} imageSrc={rulesImage} />

      <Modal show={showTwist} onHide={closeTwist}>
        <Modal.Header closeButton>
          <Modal.Title>Add a twist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="td-twist-grid">
            {TWIST_SLOTS.map((slotIndex) => (
              <div className="td-twist-card" key={slotIndex}>
                <img alt="Twist card" onClick={() => pickTwistCard(slotIndex)} src={twistSlots[slotIndex]} />
                <div className="td-actions">
                  <Button className="td-button pressable" onClick={() => pickTwistCard(slotIndex)}>
                    Show
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeTwist}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="td-card-frame">
        <img className="td-card-img" src={currentCard ?? NO_CARD_PICKED_YET} key={currentCard} alt="Truth or Drink card" />
      </div>
      <div className="td-actions">
        <Button className="td-button pressable" onClick={pickMainCard}>
          Pick Random Card
        </Button>
      </div>
    </div>
  );
};

export default TruthOrDrinkView;
