import { useState, Fragment, useEffect } from 'react';
import './App.css';
import deaddropIcon from './assets/deaddrop.svg';
import { useNavigate } from 'react-router-dom';
import socket from './socket';

function App() {

  const [username, setUsername] = useState("");
  const [usernameSelected, setUsernameSelected] = useState(false);

  const navigate = useNavigate();

  const handleUsername = (e) => {
    
    setUsername(e.target.value)
  }

  const submitUsername = (e) => {
    
    e.preventDefault();

    if (username !== "") {
      
      setUsername("");

      socket.auth = { username };

      socket.connect();

      setUsernameSelected(true);
    }

  }

  useEffect(() => {

    // get the sessionID from local storage
    const sessionInfo = localStorage.getItem("sessionInfo");

    if (sessionInfo) {

      const { sessionID, username } = JSON.parse(sessionInfo);

      setUsername(username);

      setUsernameSelected(true);
      
      socket.auth = { sessionID };

      socket.connect();
    }

    // store sessionID when session is created from server
    const storeSession = ({ userID, sessionID, username }) => {
      
      socket.auth = { sessionID };

      localStorage.setItem("sessionInfo", JSON.stringify({sessionID, username}));

      socket.userID = userID;
    }

    socket.on("newSession", storeSession);

    // handle invalid username error
    const handleUsernameError = (err) => {
      
      if (err.message = "Invalid username") {
        
        setUsernameSelected(false);
      }
    }

    socket.on("connect_error", handleUsernameError);

    return () => {
      socket.off("session", storeSession);
      socket.off("connect_error", handleUsernameError);
    }
    
  }, []);

  return (
    <Fragment>
      {usernameSelected && navigate(`/deadDrop/chat/${username}`)};
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
