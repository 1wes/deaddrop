import { useState } from 'react'
import './App.css';
import deaddropIcon from './assets/deaddrop.svg'

function App() {
  const [username, setUsername] = useState("");

  const handleUsername = (e) => {
    
    setUsername(e.target.value)
  }

  const submitUsername = (e) => {
    
    e.preventDefault();

    setUsername("")

  }

  return (
    <>
      <main>
        <h2>deaddrop</h2>
        <div className='image'>
          <img src={deaddropIcon} alt='deadrop-icon' />
        </div>
        <form onSubmit={submitUsername}>
          <input placeholder='Enter your username' value={username} onChange={handleUsername}></input>
        </form>
      </main>
    </>
  )
}

export default App
