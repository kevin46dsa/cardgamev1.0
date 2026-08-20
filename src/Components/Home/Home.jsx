import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Card } from "react-bootstrap";
import { useGamesList } from "../../hooks/useGamesList";
import { GameIDs, GameTitles } from "../../Utils/enums";

const SUDOKU_COVER =
  "https://firebasestorage.googleapis.com/v0/b/card-game-45e80.appspot.com/o/ChatGPT%20Image%20Oct%2025%2C%202025%2C%2005_26_03%20PM.png?alt=media&token=5202ef72-00f7-42f0-9321-293a71be46ac";

// Firestore-only remnants of removed games (Mr. White, You Laugh You Lose) —
// their routes/components no longer exist, so keep them off the game list.
const HIDDEN_GAME_IDS = ["MrWhite", "6vfbnEVnnoheLfGLABKk"];

const Home = () => {
  const navigate = useNavigate();
  const { games, loading } = useGamesList();

  const visibleGames = useMemo(() => {
    const withoutHidden = games.filter((game) => !HIDDEN_GAME_IDS.includes(game.ID));
    return [
      ...withoutHidden,
      {
        ID: GameIDs.sudoku,
        DATA: { name: GameTitles.sudoku, imgUrls: [SUDOKU_COVER] },
      },
    ];
  }, [games]);

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
