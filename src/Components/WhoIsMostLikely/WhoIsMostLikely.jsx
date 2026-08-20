import React from "react";
import FlashCardGame from "../FlashCardGame/FlashCardGame";
import { GameTitles, GameIDs } from "../../Utils/enums";
import { useGameDeck } from "../../hooks/useGameDeck";

function WhoIsMostLikely() {
  const GameTitle = GameTitles.WhoIsMostLikely;
  const { data, loading, message, drawId, pick } = useGameDeck(GameIDs.WhoIsMostLikely);

  return (
    <FlashCardGame
      title={GameTitle}
      message={message}
      drawId={drawId}
      ready={!loading && data?.Questions?.length > 0}
      buttons={[{ label: "Generate", onClick: () => pick("Questions") }]}
    />
  );
}

export default WhoIsMostLikely;
