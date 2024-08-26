import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import Uploader from './Components/Uploader/Uploader';  
import MainPlayer from './Components/MainPlayer/MainPlayer';  
import UploadMoreImage from './Components/Uploader/UploaderMoreImage';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import BudgetCounter from './Components/BudgetCounter/BudgetCounter';
import Truthordrinkplayer from './Components/Truthordrink/Truthordrinkplayer';
import Truthordrinkrandomplayer from './Components/Truthordrink/Truthordrinkrandom';
import CardDesign from './Components/CardDesigns/CardDesign';
import Update from './Components/Update/Update';

function App() {
  return (
        <Router>
            <div >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/:id" element={<MainPlayer/>}/>
                <Route path="/uploader/:id" element={<Uploader/>}/>
                <Route path="/update/:id" element={<Update/>}/>
                <Route path="/uploadermore/:id" element={<UploadMoreImage/>}/>
                <Route path="/budgetcounter/:id" element={<BudgetCounter/>}/>
                <Route path="/truthordrinkrandom" element={<Truthordrinkrandomplayer/>}/>
                <Route path="/truthordrink/:id" element={<Truthordrinkplayer/>}/>
                <Route path="/testDesign" element={<CardDesign message="test"/>} />
                
              </Routes>
            </div>
        </Router>
        
      );
    };
    
    export default App;

