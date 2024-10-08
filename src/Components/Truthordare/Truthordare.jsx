import React, { useState , useEffect } from 'react';
import CardDesign from '../CardDesigns/CardDesign';
import { fetchGame } from '../../Utils/Basic';

function TruthorDare()  {
    const [message, setMessage] = useState('');
    const [Truth, setTruth] = useState([]);
    const [Dare, setDare] = useState([]);
    const [title,setTitle] = useState("")
    const GameTitle = "Truth or Dare";
      
      const handleDareClick = (dareMessages) => {
       
        const randomDare = dareMessages[Math.floor(Math.random() * dareMessages.length)];
        setMessage(randomDare);
        setTitle("Dare")
      };

      const handleTruthClick = (truthMessages) => {
        const randomTruth = truthMessages[Math.floor(Math.random() * truthMessages.length)];
        setMessage(randomTruth);
        setTitle("Truth")
      };
      
      useEffect(() => {
		async function fetchListings() {
			try {
				// execute the query

              const data = await fetchGame("TruthorDare")
              if (data) {
                setTruth(data.truth)
                setDare(data.Dare)
              }
			} catch (error) {
				console.log(error);
			}
		}
		fetchListings();
	}, []);


    return (
        <div className="truthor-dare-container">
        <br/>
        <br/>
        <br/>
        <h1>{GameTitle}</h1>
        <br/>
        <br/>
        {message && <CardDesign message={message} title={title}/>}
        <div className="button-container">
          <button onClick={() => handleTruthClick(Truth)}>Truth</button>
          <button onClick={() => handleDareClick(Dare)}>Dare</button>
        </div>
        <style >{`
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
    };
    
export default TruthorDare;
