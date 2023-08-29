import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import Uploader from './Components/Uploader/Uploader';  
import MainPlayer from './Components/MainPlayer/MainPlayer';  
import UploadMoreImage from './Components/Uploader/UploaderMoreImage';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import BudgetCounter from './Components/BudgetCounter/BudgetCounter';

function App() {
  return (
        <Router>
            <div >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path="/:id" element={<MainPlayer/>}/>
                <Route path="/uploader/:id" element={<Uploader/>}/>
                <Route path="/uploadermore/:id" element={<UploadMoreImage/>}/>
                <Route path="/budgetcounter/:id" element={<BudgetCounter/>}/>
              </Routes>
            </div>
        </Router>
        
      );
    };
    
    export default App;

