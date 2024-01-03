import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatArea from './chat.jsx'
import SocketContextProvider from './context/socketContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <SocketContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<App />} ></Route>
          <Route path='/deadDrop/chat/:username' element={<ChatArea/>} ></Route>
        </Routes>
      </BrowserRouter>
  </SocketContextProvider>
)
