import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import Uploader from './Components/Uploader/Uploader';  
import MainPlayer from './Components/MainPlayer/MainPlayer';  
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

function App() {
  return (
        <Router>
            <div >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/:id" element={<MainPlayer/>}/>
                <Route path="/uploader/:id" element={<Uploader/>}/>
              </Routes>
            </div>
        </Router>
        
      );
    };
    
    export default App;

