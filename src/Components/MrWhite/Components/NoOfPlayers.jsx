import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const NoOfPlayers = (props) => {
  const { show, createGameFunc } = props;

  const [noOfPlayers, setNoOfPlayers] = useState(3);

  return (
    <Modal show={show} onHide={() => {}}>
      <Modal.Header>
        <Modal.Title>Choose Number of Players</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="selectNumberOfPlayers">
            <Form.Label>Number of Players</Form.Label>
            <Form.Control
              as="select"
              value={noOfPlayers}
              onChange={(e) => setNoOfPlayers(Number(e.target.value))}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={async () => {
            console.log(noOfPlayers);
            await createGameFunc(noOfPlayers);
          }}
        >
          Start Game
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NoOfPlayers;
