import React from "react";
import { Modal, Button, Image } from "react-bootstrap";

/**
 * Shared "show game rules as an image" modal, previously copy-pasted
 * in Game.jsx, Truthordrinkplayer.jsx and Truthordrinkrandom.jsx.
 */
const RulesModal = ({ show, onHide, title, imageSrc }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Image className="d-block w-100" src={imageSrc} alt="Rules" />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

export default RulesModal;
