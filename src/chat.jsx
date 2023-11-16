import { Fragment, useState, useEffect, useRef } from "react";

import './chat.css'
import deadDrop from './assets/deaddrop.svg'

import { useParams } from "react-router-dom";

import { LuSendHorizonal } from 'react-icons/lu';

import socket from "./socket";

import { FaLockOpen } from 'react-icons/fa';

const HeroPage = () => {
    
    return (
        <Fragment>
            <div className="hero-page">
                <img className="hero-image" src={deadDrop} />
                <h2>
                    DeadDrop
                </h2>
                <p className="hero-description">
                    Send and receive messages (un)confidentially.
                </p>
            </div>
        </Fragment>
    )
}

const ChatArea = () => {

    const [messages, setMessages] = useState([]);
    const [messageBody, setMessageBody] = useState("");
    const [users, setUsers] = useState({
        connected:[]
    })
    const [activeUsers, setActiveUsers] = useState({
        recipient: "",
        id: "",
    })

    const username = useParams().username;

    const latestMessage = useRef(null);

    useEffect(() => {
        
        if (latestMessage.current) {
            latestMessage.current.scrollIntoView({
                behavior:"smooth"
            })
        }
    },[messages.length])

    useEffect(() => {

        socket.on("users", (users) => {
            
            setUsers({
                connected: users
            });
        })

        socket.auth = {username}

        socket.connect();

        socket.on("connect", () => {
            socket.emit("joinRoom")
        });

        socket.on("message-response", (message) => {
            setMessages((_messages) => [..._messages, message]);
        })

        socket.on("connect_error", (err) => {
            
            if (err.message === "Invalid username") {
                console.log(err);
            }
        })
        
    }, [messages]);

    const handleMessage = (e) => {
        
        setMessageBody(e.target.value);
    }

    const selectRecipient = (event, param) => {
        
        setActiveUsers({
            recipient: param.name,
            id: param.id,
        });
    }

    const sendMessage = (e) => {
        
        e.preventDefault();

        if (messageBody !== "" && activeUsers.recipient!=="") {

            const messageDetails = {
                body: messageBody,
                sender:username,
                senderId:senderId[0].userId,
                recipientName: activeUsers.recipient,
                recipientId: activeUsers.id
            }

            socket.emit("sent-message", messageDetails);
        }

        setMessageBody("");
    }

    const senderId = users.connected ? users.connected.filter((user) => {
        return user.username===username
    }) : ""
    
    const myNetwork = users.connected ? users.connected.filter((uniqueUsers) => {
        return uniqueUsers.username!==username
    }).map((user) => (
        <li key={user.userId} className={user.userId===activeUsers.id?"active-user":"non-active-user"} onClick={event=>selectRecipient(event, {name:user.username, id:user.userId})}>
            <span className="user-icon">
                {user.username.substring(0, 1)}
            </span>
            <span>
                {user.username}
            </span>
        </li>
        )
    ):""
    
    return (
        
        <Fragment>
            <main className="chatrooms">
                <div className="connected-users">
                    <div className="chat-header">
                        <div className="image">
                            <img src={deadDrop} alt="deadrop-logo" />
                        </div>
                        <h2>{ `~@${username}`}</h2>
                    </div>
                    <ul className="user-list">
                        {myNetwork}
                    </ul>
                    <div className="contacts-footer">
                        <i className="icon">
                            <FaLockOpen/>
                        </i>
                        <span className="disclaimer">Your messages are not end-to-end encrypted, yet 😂!!</span>
                    </div>
                </div>
                {activeUsers.recipient!=="" && <div className="chat">
                    <div className="chat-header">
                        <div className="image" id="name">
                            {activeUsers.recipient.substring(0, 1)}
                        </div>
                        <h2>{activeUsers.recipient}</h2>
                    </div>
                    <div className="chat-area">
                        {
                            messages.map((message) => (
                            
                                <article key={message.sentAt} className={message.sender === username ? "me" : "receiver"} >
                                    <header className="bubble-header">
                                        <h4 className="sender">
                                            {message.sender === username ? "You" : message.sender}
                                        </h4>
                                        <span className="timestamp">
                                            {new Date(message.sentAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
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
                                <LuSendHorizonal />
                            </i>
                        </button>
                    </div>
                </div>}
                <HeroPage/>
            </main>
        </Fragment>
    )
}
export default ChatArea;