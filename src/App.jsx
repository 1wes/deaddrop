import { useState, Fragment, useEffect } from 'react';

import './App.css';

import deaddropIcon from './assets/deaddrop.svg';

import { useNavigate } from 'react-router-dom';

import socket from './socket';

import { useSocketContext } from './context/socketContext';

function App() {

  const [username, setUsername] = useState("");
  const [usernameSelected, setUsernameSelected] = useState(false);
  const [sessionReceived, setSessionReceived] = useState(false);

  const { setSocket } = useSocketContext();

  const navigate = useNavigate();


  const handleUsername = (e) => {
    
    setUsername(e.target.value)
  }

  const submitUsername = (e) => {
    
    e.preventDefault();

    if (username !== "") {
      
      socket.auth = { username };

      socket.connect();
    }
  }

  useEffect(() => {

    // get the sessionID from local storage
    const sessionInfo = localStorage.getItem("sessionInfo");

    if (sessionInfo) {

      const { sessionID, username } = JSON.parse(sessionInfo);

      setUsername(username);
      
      socket.auth = { sessionID, username };

      socket.connect();

      setUsernameSelected(true);

      setSessionReceived(true);
    }

    // handle invalid username error
    const handleUsernameError = (err) => {
              
        if (err.message = "Invalid username") {
        
          setUsernameSelected(false);
        }
    }

    // store sessionID when session is created from server
    const storeSession = ({ userID, sessionID, username }) => {        
      
      socket.auth = { sessionID, username };
  
      localStorage.setItem("sessionInfo", JSON.stringify({sessionID, username}));
  
      socket.userID = userID;

      setSessionReceived(true);

      setUsernameSelected(true);
    }

    socket.on("connect_error", handleUsernameError);
    socket.on("newSession", storeSession);

    // if session exists, go to chat page
    if (usernameSelected && sessionReceived) {
      
      navigate(`/deadDrop/chat/${username}`);
    
      setUsername("");

      setSessionReceived(false);
    };

    setSocket(socket);

    return () => {
      socket.off("connect_error", handleUsernameError);
      socket.off("newSession", storeSession);
    }

  }, [setSocket, usernameSelected, username, navigate]);

  return (
    <Fragment>
      <nav>
        <div className='image'>
          <img src={deaddropIcon} alt='deadrop-icon' />
        </div>
        <h2>deadDrop</h2>
      </nav>
      <main className='hero'>
        <h3>Join us now</h3>
        <form className='username' onSubmit={submitUsername}>
          <input placeholder='Enter your username' value={username} onChange={handleUsername}></input>
        </form>
        <div className='submit-btn'>
          <button type='submit' onClick={submitUsername}>
            Join deadDrop
          </button>
        </div>
      </main>
    </Fragment>
  )
}

export default App
