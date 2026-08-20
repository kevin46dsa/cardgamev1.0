import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Card } from "react-bootstrap";
import { useGamesList } from "../../hooks/useGamesList";
import { GameIDs, GameTitles } from "../../Utils/enums";
import { s3Url } from "../../Utils/s3";

const SUDOKU_COVER =
  "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/ChatGPT%20Image%20Oct%2025%2C%202025%2C%2005_26_03%20PM.png?alt=media&token=5202ef72-00f7-42f0-9321-293a71be46ac";



// Games that live in their own top-level Firestore collection (not the
// generic "game" collection Home otherwise lists), so they're added here
// by hand — same reason Sudoku has always been hardcoded below.
const EXTRA_GAMES = [
  {
    ID: GameIDs.sudoku,
    DATA: { name: GameTitles.sudoku, imgUrls: [SUDOKU_COVER] },
  },
  {
    ID: GameIDs.truthordrink,
    DATA: { name: GameTitles.truthordrink, imgUrls: [s3Url("utility", "cover picture al.png")] },
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { games, loading } = useGamesList();

  const visibleGames = useMemo(() => [...games, ...EXTRA_GAMES], [games]);

  return (
    <div>
      <br />
      <br />
      <br />

      <h1 style={{ textAlign: "center", fontWeight: "bold" }}>Pick A Game</h1>
      <br />
      <br />
      <Container>
        <Row xs={1} sm={1} md={1} lg={2}>
          {!loading &&
            visibleGames.map((game) => (
              <Col key={game.ID}>
                <Card style={{ margin: "20px" }}>
                  <Card.Img
                    alt="Game Cover"
                    onClick={() => navigate(`/${game.ID}`)}
                    src={game.DATA.imgUrls[0]}
                    style={{ height: "400px" }}
                  />
                  <Card.Body style={{ textAlign: "center" }}>
                    <Button size="lg" onClick={() => navigate(`/${game.ID}`)}>
                      Lets play {game.DATA.name}!!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      </Container>
    </div>
  );
};

export default Home;
