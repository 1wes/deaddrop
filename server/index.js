const express = require('express');
const app = express();
const cors = require('cors');
const { port } = require('./env-config');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const { session_secret } = require('./env-config');
const socketSession = require('express-socket.io-session');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);

// expression session middleware
const sessionMiddleware = session({
    saveUninitialized: true,
    resave: false,
    secret: session_secret
});

app.use(sessionMiddleware);

app.get("/", (req, res) => {
    res.send("This is the homepage buoy");
});


const io = socketIo(server, {
    cors: {
        origin:"http://localhost:5173"
    }
});

// socket session middleware
io.use(socketSession(sessionMiddleware, {
    autoSave: true
}));

const connectedUsers = new Map(); // Map to store connected users

io.use((socket, next) => {
    const username = socket.handshake.auth.username;

    if (!username) {
        return next(new Error("Invalid username"))
    }

    socket.username = username;

    connectedUsers.set(socket.id, { id: socket.id, username, online:true, typing:false });

    next();
});

io.on("connection", (socket) => {

    io.emit("users", Array.from(connectedUsers.values()));

    // send message to recipient and back to sender
    socket.on("sent-message", (msg) => {

        const message = {
            body: msg.body,
            sender: socket.username,
            senderId: msg.senderId,
            recipient: msg.recipientName,
            recipientId: msg.recipientId,
            sentAt: new Date(Date.now())
        }
                                    
        io.to(message.recipientId).emit("message-response", message);

        io.to(socket.id).emit("message-response", message); 
    });

    // notify send that their message has been read
    socket.on("message-read", (inboxDetails) => {

        io.to(inboxDetails.senderId).emit("message-read", inboxDetails);
    });

    // notify recipient when sender is typing
    socket.on("user-is-typing", (typerDetails) => {

        connectedUsers.set(socket.id, {
            ...connectedUsers.get(typerDetails.typerId), typing: true, recipient:typerDetails.recipientId, typer:typerDetails.typer
        });
          
        io.emit("users", Array.from(connectedUsers.values()));
        
        io.to(typerDetails.recipientId).emit("user-is-typing", typerDetails);
    });

    // update online status once user disconnects
    socket.on("disconnect", () => {
        connectedUsers.set(socket.id, {
            ...connectedUsers.get(socket.id), online: false, lastSeen: new Date(Date.now())
        });

        connectedUsers.delete(socket.id)
        
        io.emit("users", Array.from(connectedUsers.values()));
    });
})

server.listen(port, () => {
    console.log(`Server running at port ${port}`)
});


