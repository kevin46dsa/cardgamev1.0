import React from 'react';
import { useParams} from 'react-router-dom';

import Game from '../Games/Game';
import TruthorDare from '../Truthordare/Truthordare';
import NeverHave from '../NeverHave/NeverHave';
import ChatGPT from '../ChatGPT/ChatGPT';

const MainPlayer = () => {
    
    let {id} = useParams()
 


    return(
        <div style={{padding: "50px"}}> 
            {(() =>{
                switch (id) {
                    case 'TruthorDare':
                        return (<TruthorDare />)
                    case "Neverhaveiever":
                        return (<NeverHave/>)
                    case "ChatGPT":
                        return (<ChatGPT/>)
                    default:
                        return (<Game />)
            }})()}
        </div>
    )
  
  
};

export default MainPlayer;