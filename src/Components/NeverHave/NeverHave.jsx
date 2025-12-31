import React, { useState, useEffect } from "react";
import CardDesign from "../CardDesigns/CardDesign";
import { GameTitles } from "../../Utils/enums";
import { fetchGame } from "../../Utils/Basic";

function NeverHave() {
  const [message, setMessage] = useState("");
  const [Never, setNever] = useState([]);
  const GameTitle = GameTitles.Neverhaveiever;

  useEffect(() => {
    async function fetchListings() {
      try {
        // execute the query
        const data = await fetchGame("Neverhaveiever");
        if (data.Questions.length > 0) {
          setNever(data.Questions);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchListings();
  }, []);

  const handleNeverClick = (truthMessages) => {
    const randomTruth =
      truthMessages[Math.floor(Math.random() * truthMessages.length)];
    setMessage(randomTruth);
  };

  return (
    <div className="truthor-dare-container">
      <br />
      <br />
      <br />
      <h1>{GameTitle}</h1>
      <br />
      <br />
      {message && <CardDesign message={message} title={GameTitle} />}
      {Never.length > 0 && (
        <div className="button-container">
          <button onClick={() => handleNeverClick(Never)}>Generate</button>
        </div>
      )}

      <style>{`
          .truthor-dare-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
  
          .button-container {
            display: flex;
            justify-content: center;
            margin-top: 20px;
          }
  
          button {
            margin: 10px;
            padding: 10px 20px;
            font-size: 18px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
  
          @media (max-width: 480px) {
            h1 {
              font-size: 24px;
            }
  
            button {
              font-size: 16px;
              padding: 8px 16px;
            }
          }
        `}</style>
    </div>
  );
}

export default NeverHave;
