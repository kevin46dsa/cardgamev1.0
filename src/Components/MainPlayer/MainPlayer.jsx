import React from 'react';
import { useParams} from 'react-router-dom';
import { GameIDs } from '../../Utils/enums';
import Game from '../Games/Game';
import TruthorDare from '../Truthordare/Truthordare';
import NeverHave from '../NeverHave/NeverHave';
import ChatGPT from '../ChatGPT/ChatGPT';
import Truthordrink from '../Truthordrink/Truthordrink';

const MainPlayer = () => {
    
    let {id} = useParams()
 


    return(
        <div style={{padding: "50px"}}> 
            {(() =>{
                switch (id) {
                    case GameIDs.TruthorDare:
                        return (<TruthorDare />)
                    case GameIDs.Neverhaveiever:
                        return (<NeverHave/>)
                    case GameIDs.ChatGPT:
                        return (<ChatGPT/>)
                    case GameIDs.truthordrink:
                        return (<Truthordrink/>)
                    default:
                        return (<Game />)
            }})()}
        </div>
    )
  
  
};

export default MainPlayer;