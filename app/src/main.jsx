import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' // Keep only createRoot here
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom' // Move these here
import App from './App.jsx'
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap/dist/js/bootstrap.bundle.js"
import Benvolio from "./pages/ABTbenvolio.jsx"
import Menu from "./pages/menu.jsx"
import CreateProject from './pages/createprj.jsx'
import SignIn from './pages/signin.jsx'
import SignUp from './pages/signup.jsx'
import WhatIsITECify from './pages/whatsITECIFY.jsx'
import Home from './pages/Home.jsx'

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
          <Route path="/coding/:isNew/:roomId/:lang" element={<App/>}/>
        </Routes>
      </div>
    </Router>
  </StrictMode>,
)
