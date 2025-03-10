import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import MainPlayer from './Components/MainPlayer/MainPlayer';  
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import BudgetCounter from './Components/BudgetCounter/BudgetCounter';
import Truthordrinkplayer from './Components/Truthordrink/Truthordrinkplayer';
import Truthordrinkrandomplayer from './Components/Truthordrink/Truthordrinkrandom';
import UpdateMenu from './Components/UpdateMenu/UpdateMenu';
import GenerateFolder from './Components/GenerateFolder/GenerateFolder';

function App() {
  return (
        <Router>
            <div >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/:id" element={<MainPlayer/>}/>
                <Route path="/update/:id" element={<UpdateMenu/>}/>
                <Route path="/budgetcounter/:id" element={<BudgetCounter/>}/>
                <Route path="/truthordrinkrandom" element={<Truthordrinkrandomplayer/>}/>
                <Route path="/truthordrink/:id" element={<Truthordrinkplayer/>}/>
                <Route path="/extra/generatefolder" element={<GenerateFolder />} />
              </Routes>
            </div>
        </Router>
        
      );
    };
    
    export default App;

