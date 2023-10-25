import { Fragment, useState, useEffect } from "react";

import './chat.css'
import deadDrop from './assets/deaddrop.svg'

import { useParams } from "react-router-dom";

import { LuSendHorizonal } from 'react-icons/lu';

const ChatArea = () => {

    const [messages, setMessage] = useState([]);
    const [messageBody, setMessageBody] = useState("");

    const username = useParams().username;

    useEffect(() => {
        
    }, []);

    const handleMessage = (e) => {
        
        setMessageBody(e.target.value);
    }

    const sendMessage = (e) => {
        
        e.preventDefault();

        alert(messageBody);

        setMessageBody("");
    }
    
    return (
        
        <Fragment>
            <div className="chat">
                <div className="chat-header">
                    <div className="image">
                        <img src={deadDrop} alt="deadrop-logo" />
                    </div>
                    <h2>{ username }</h2>
                </div>
                <div className="chat-area">

                </div>
                <div className="message-input">
                    <form className="message" onSubmit={sendMessage} > 
                        <input placeholder="Type your message here" value={messageBody} onChange={handleMessage} ></input>
                    </form>
                    <button className="send-msg" type="submit" onClick={sendMessage}>
                        <i>
                            <LuSendHorizonal/>
                        </i>
                    </button>
                </div>
            </div>
        </Fragment>
    )
}
export default ChatArea;