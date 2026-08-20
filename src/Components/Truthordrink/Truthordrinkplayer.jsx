import React from "react";
import { useParams } from "react-router-dom";
import TruthOrDrinkView from "./TruthOrDrinkView";

const Truthordrinkplayer = () => {
  const { id } = useParams();
  return <TruthOrDrinkView mode="single" id={id} />;
};

export default Truthordrinkplayer;
