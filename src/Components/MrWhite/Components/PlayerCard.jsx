import { useState } from "react";
import Button from "react-bootstrap/Button";
import { Modal } from "react-bootstrap";

const PlayerCard = (props) => {
  const { name, word } = props;
  const [show, setShow] = useState(false);
  const onClose = () => setShow(false);
  return (
    <div>
      <Button variant="primary" onClick={() => setShow(true)}>
        i
      </Button>
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Assigned Word: {word}</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PlayerCard;
