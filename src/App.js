import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Home from './Home';
import Registration from './Registration';
import DonorSearch from './DonorSearch';
import Footer from './Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/search" element={<DonorSearch key="search" />} />
          <Route path="/search/:district" element={<DonorSearch key="search-district" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;