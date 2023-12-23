import { useState, Fragment, useEffect } from 'react';
import './App.css';
import deaddropIcon from './assets/deaddrop.svg';
import { useNavigate } from 'react-router-dom';
import socket from './socket';

function App() {

  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const handleUsername = (e) => {
    
    setUsername(e.target.value)
  }

  const submitUsername = (e) => {
    
    e.preventDefault();

    if (username !== "") {
      
      navigate(`/deadDrop/chat/${username}`);

      setUsername("");

      socket.auth = { username };

      socket.connect();
    }

  }

  useEffect(() => {

    // get the sessionID from local storage
    const sessionID = localStorage.getItem("sessionID");

    if (sessionID) {
      
      socket.auth = { sessionID };

      socket.connect();
    }

    // store sessionID when session is created from server
    socket.on("session", ({ sessionID, userID }) => {
      
      socket.auth = { sessionID };

      localStorage.setItem("sessionID", sessionID);

      socket.userID = userID;
    });

    return () => {
      socket.removeAllListeners();
    }
    
  }, []);

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
