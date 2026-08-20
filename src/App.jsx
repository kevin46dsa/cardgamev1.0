import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Components/Home/Home';
import MainPlayer from './Components/MainPlayer/MainPlayer';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Truthordrinkplayer from './Components/Truthordrink/Truthordrinkplayer';
import Truthordrinkrandomplayer from './Components/Truthordrink/Truthordrinkrandom';
import UpdateMenu from './Components/UpdateMenu/UpdateMenu';
import GenerateFolder from './Components/GenerateFolder/GenerateFolder';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider } from './providers/ToastProvider';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <div>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path="/:id" element={<MainPlayer/>}/>
              <Route path="/update/:id" element={<UpdateMenu/>}/>
              <Route path="/truthordrinkrandom" element={<Truthordrinkrandomplayer/>}/>
              <Route path="/truthordrink/:id" element={<Truthordrinkplayer/>}/>
              <Route path="/extra/generatefolder" element={<GenerateFolder />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
