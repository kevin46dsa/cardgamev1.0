import React, { useState } from "react";
import FlashCardGame from "../FlashCardGame/FlashCardGame";
import { GameIDs } from "../../Utils/enums";
import { useGameDeck } from "../../hooks/useGameDeck";

const GameTitle = "Truth or Dare";

function TruthorDare() {
  const { data, loading, message, drawId, pick } = useGameDeck(GameIDs.TruthorDare);
  const [cardTitle, setCardTitle] = useState("");

  const draw = (label, field) => {
    pick(field);
    setCardTitle(label);
  };

  return (
    <FlashCardGame
      title={GameTitle}
      cardTitle={cardTitle}
      message={message}
      drawId={drawId}
      ready={!loading && (data?.truth?.length > 0 || data?.Dare?.length > 0)}
      buttons={[
        { label: "Truth", onClick: () => draw("Truth", "truth") },
        { label: "Dare", onClick: () => draw("Dare", "Dare") },
      ]}
    />
  );
}

export default TruthorDare;
