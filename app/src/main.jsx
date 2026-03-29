import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' // Keep only createRoot here
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom' // Move these here
import App from './App.jsx'
<<<<<<< HEAD
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap/dist/js/bootstrap.bundle.js"
import Benvolio from "./pages/ABTbenvolio.jsx"
import Menu from "./pages/menu.jsx"
import CreateProject from './pages/createprj.jsx'
import SignIn from './pages/signin.jsx'
import SignUp from './pages/signup.jsx'
import WhatIsITECify from './pages/whatsITECIFY.jsx'
import Home from './pages/Home.jsx'
=======

>>>>>>> 9025a01081230b6a6c1e74d3da266706aa769a79

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Menu />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/about-benvolio" element={<Benvolio />} />
          <Route path="/whatis-itecify" element={<WhatIsITECify />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </div>
    </Router>
  </StrictMode>,
)
