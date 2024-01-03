import { Fragment, useState, useEffect, useRef } from "react";

import './chat.css';

import { useParams } from "react-router-dom";

import { LuSendHorizonal } from 'react-icons/lu';
import { FaLockOpen } from 'react-icons/fa';
import { IoCheckmarkDone } from "react-icons/io5";

import { useSocketContext } from "./context/socketContext";

import deadDrop from './assets/deaddrop.svg'
import openSound from './assets/ringtone-1-46486.mp3';
import closedSound from './assets/hotel-bell-ding-1-174457.mp3';



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
        online:""
    });
    const [userAction, setUserAction] = useState({
        typing: false,
        typerId: "",
        recipient: ""
    });
    const [timer, setTimer] = useState(null);

    const { socket } = useSocketContext();

    const username = useParams().username;

    const latestMessage = useRef(null);
    const messageInput = useRef(null);

    const openInboxAudio = new Audio(openSound);
    const closedInboxAudio = new Audio(closedSound);

    useEffect(() => {
        
        if (latestMessage.current) {
            latestMessage.current.scrollIntoView({
                behavior:"smooth"
            })
        }
    },[messages.length])

    useEffect(() => {

        if (messageInput.current) {

            messageInput.current.focus();
        }

        if (socket) {

            socket.on("users", (users) => {

                setUsers((prevUsers) => ({ ...prevUsers, connected: users }))
            });
    
            socket.on("message-response", (msg) => {
        
                // if message is for selected inbox, mark as read
                const message = activeUsers.id === msg.senderId ? { ...msg, read: true } : { ...msg, read: false };
                
                setMessages((prevMessage) => [...prevMessage, message]);
    
                // play different notification chime depending on whether inbox is open or closed
                msg.sender === username ? "" : activeUsers.id === msg.senderId ? openInboxAudio.play() : closedInboxAudio.play();
    
                // if message is received while inbox is open, send notification to sender to blue tick
                if (message.senderId === activeUsers.id) {
                    sendReadNotification({ senderId: message.senderId, recipientId: message.recipientId });
                }
            });
    
            socket.on("message-read", (inboxDetails) => {
    
                setMessages((prevMessages) =>
                    prevMessages.map((message) =>
                        message.recipientId === inboxDetails.recipientId ? { ...message, read: true } : message
                    ));
                
            });
    
            socket.on("user-is-typing", (typerDetails) => {
                setUserAction((prevUserAction) => ({
                    ...prevUserAction,
                    typing: true,
                    typerId: typerDetails.typerId,
                    recipient: typerDetails.recipientId
                }))
            });
    
            socket.on("stop-typing-indicator", () => {
                
                setUserAction((prevActiveUsers) => ({
                    ...prevActiveUsers,
                    typing:false,
                    typerId: "",
                    recipient: ""
                }));
            })
    
            socket.on("connect_error", (err) => {
                
                if (err.message === "Invalid username") {
                    console.log(err);
                }
            })
    
            socket.on("disconnect", () => {
                console.log(`Disconnected`);
            });
            
            return () => {
                socket.removeAllListeners();
            }
        }
        
    }, [messages, activeUsers, openInboxAudio, closedInboxAudio, messageInput]);

    const handleMessage = (e) => {
        
        setMessageBody(e.target.value);

        clearTimeout(timer);

        // once user stops typing for 500 milliseconds, send stop event. 
        const newTimer = setTimeout(() => {
            socket.emit("stop-typing-indicator", {recipientId: activeUsers.id });
        }, 500);

        setTimer(newTimer);

        socket.emit("user-is-typing", { typer: username, typerId: senderId[0].id, recipientId: activeUsers.id });
    }

    const sendReadNotification = (sender) => {
        
        socket.emit("message-read", sender);
    }

    const selectRecipient = (event, param) => {
        
        setActiveUsers((prevActiveUsers) => ({
            ...prevActiveUsers,
            recipient: param.name,
            id: param.id,
        }));

        // mark message as read on opening inbox
        setMessages((prevMessages) =>
            prevMessages.map((message) =>
                message.senderId === param.id ? { ...message, read: true } : message
            ));    
        
        const lastMessage = messages[messages.length - 1];
        
        if (messages.length && lastMessage.senderId === param.id) {
            sendReadNotification({ senderId: lastMessage.senderId, recipientId:lastMessage.recipientId });
        }
    }

    const sendMessage = (e) => {
        
        e.preventDefault();

        if (messageBody !== "" && activeUsers.recipient!=="") {

            const messageDetails = {
                body: messageBody,
                sender: username,
                senderId:senderId[0].id,
                recipientName: activeUsers.recipient,
                recipientId:activeUsers.id
            }

            socket.emit("sent-message", messageDetails);
        }

        setMessageBody("");
    }

    const senderId = users.connected ? users.connected.filter((user) => {
        return user.username === username
    }) : "";
    
    const myNetwork = users.connected ? users.connected.filter((uniqueUsers) => {
        return uniqueUsers.username !== username
    }).map((user, index) => (
        <li key={index} className={user.id === activeUsers.id ? "active-user" : "non-active-user"}
            onClick={event => selectRecipient(event, { name: user.username, id: user.id })}>
            <span className="user-icon">
                {user.username.substring(0, 1)}
            </span>
            <span>
                {user.username}
            </span>
            {
                // check if current listed inboxes have unread messages
                messages.some(
                    (message) =>
                        (user.id === message.senderId && !message.read)
                ) && user.id !== activeUsers.id && <span className="unread-badge"> {
                    messages.filter((message) => !message.read && user.id === message.senderId).length
                } </span>
            }
        </li>
    )
    ) : "";


    const isWhen = (whenLastSeen) => {
        
        const currentDate = new Date().toDateString();

        const dateLastSeen = new Date(whenLastSeen).toDateString();

        const previousDay = new Date(currentDate);

        // get yesterday's date
        previousDay.setDate(previousDay.getDate() - 1);

        const yesterday = new Date(previousDay).toDateString();

        if (dateLastSeen === currentDate) {
            
            return `last seen today at ${new Date(whenLastSeen).toLocaleTimeString(undefined, { timeStyle: 'short' })}`;
            
        } else if (dateLastSeen===yesterday) {
            
            return `last seen yesterday at ${new Date(whenLastSeen).toLocaleTimeString(undefined, { timeStyle: 'short' })}`;

        } else {
            
            return `last seen on ${new Date(whenLastSeen).toLocaleDateString(undefined, { dateStyle: 'medium' })} at 
            ${new Date(whenLastSeen).toLocaleTimeString(undefined, { timeStyle: 'short' })}`;
        }

    }

    //check whether user is online
    const onlineStatus = () => {
        
        const user=users.connected.find(({id})=>id===activeUsers.id)

        if (user) {
            
            return user.online?`online`:`${isWhen(user.lastSeen)}`
        }
    }

    const senderTyping = () => {
        
        if (userAction.typing) {

            return userAction.typerId === activeUsers.id ? `typing...` : undefined
        }
        
    }

    // if user is online and typing, indicate typing.
    const userOnlineStatus = onlineStatus()==="online" && senderTyping()!==undefined? senderTyping():onlineStatus()
        
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
                {activeUsers.recipient !== "" ? <div className="chat">
                    <div className="chat-header">
                        <div className="image" id="name">
                            {activeUsers.recipient.substring(0, 1)}
                        </div>
                        <div className="user-inbox-details"> 
                            <h2>{activeUsers.recipient}</h2>
                            <h6 className="user-status"> { userOnlineStatus } </h6>
                        </div>
                    </div>
                    <div className="chat-area">
                        {
                            messages.map((message, index) => (
                                (message.senderId===activeUsers.id  || activeUsers.id===message.recipientId) &&
                                <article key={index} className={message.sender === username ? "me" : "receiver"} >
                                    <p className="message-body">
                                        {message.body}
                                    </p>
                                    
                                    <header className="bubble-header">
                                        <span className="timestamp">
                                            {new Date(message.sentAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                                        </span>
                                            { message.sender===username && <span>
                                                <i className={message.read?"read":"unread"} id="read-message-tick">
                                                    <IoCheckmarkDone />
                                                </i>
                                            </span>}
                                    </header>
                                </article>
                            ))
                        }
                        <div ref={latestMessage} ></div>
                    </div>
                    <div className="message-input">
                        <form className="message" onSubmit={sendMessage} >
                            <input placeholder="Type your message here" autoFocus ref={messageInput} value={messageBody}
                                onChange={handleMessage}></input>
                        </form>
                        <button className="send-msg" type="submit" onClick={sendMessage}>
                            <i>
                                <LuSendHorizonal />
                            </i>
                        </button>
                    </div>
                </div> :
                <HeroPage />}
            </main>
        </Fragment>
    )
}
export default ChatArea;