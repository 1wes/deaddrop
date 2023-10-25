import { Fragment, useState, useEffect, useRef } from "react";

import './chat.css'
import deadDrop from './assets/deaddrop.svg'

import { useParams } from "react-router-dom";

import { LuSendHorizonal } from 'react-icons/lu';


const ChatArea = () => {

    const [messages, setMessages] = useState([]);
    const [messageBody, setMessageBody] = useState("");

    const username = useParams().username;

    const ws = useRef();
    const latestMessage = useRef(null);

    useEffect(() => {
        
        if (latestMessage.current) {
            latestMessage.current.scrollIntoView({
                behavior:"smooth"
            })
        }
    },[messages.length])

    useEffect(() => {

        ws.current = new WebSocket("ws://localhost:8080");

        ws.current.onopen = () => {
            console.log("connection opened");
        }

        ws.current.onmessage = (ev) => {
            
            const message = JSON.parse(ev.data);

            setMessages((_messages) => [..._messages, message]);
        }

        return () => {
            
            console.log("Cleaning up...")

            ws.current.close();
        }
        
    }, []);

    const handleMessage = (e) => {
        
        setMessageBody(e.target.value);
    }

    const sendMessage = (e) => {
        
        e.preventDefault();

        // dont send empty messages
        if (messageBody !== "") {
            ws.current.send(JSON.stringify({
                sender: username,
                body: messageBody
            }));
        }

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
                    {
                        messages.map((message) => (
                            
                            <article key={message.sentAt} className={message.sender===username?"me":"receiver"} >
                                <header className="bubble-header">
                                    <h4 className="sender">
                                        {message.sender===username?"You":message.sender}
                                    </h4>
                                    <span className="timestamp"> 
                                        {new Date(message.sentAt).toLocaleTimeString(undefined, {timeStyle:"short"})}
                                    </span>
                                </header>
                                <p className="message-body">
                                    {message.body}
                                </p>
                            </article>
                        ))
                    }
                    <div ref={latestMessage} ></div>
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