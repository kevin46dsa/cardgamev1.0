import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import Game from './Components/Games/Game';    
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

function App() {
  return (
        <Router>
            <div >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/:id" element={<Game/>}/>
              </Routes>
            </div>
        </Router>
        
      );
    };
    
    export default App;

