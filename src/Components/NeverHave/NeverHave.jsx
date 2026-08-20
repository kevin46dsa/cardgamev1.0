import React from "react";
import FlashCardGame from "../FlashCardGame/FlashCardGame";
import { GameIDs, GameTitles } from "../../Utils/enums";
import { useGameDeck } from "../../hooks/useGameDeck";

function NeverHave() {
  const GameTitle = GameTitles.Neverhaveiever;
  const { data, loading, message, drawId, pick } = useGameDeck(GameIDs.Neverhaveiever);

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

export default NeverHave;
