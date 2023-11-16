const express = require('express');
const app = express();
const cors = require('cors');
const { port } = require('./env-config');
const http = require('http');
const socketIo = require('socket.io');
const { randomInt } = require('crypto');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
    res.send("This is the homepage buoy");
});

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin:"http://localhost:5173"
    }
});

const connectedUsers = new Map(); // Map to store connected users

io.use((socket, next) => {
    const username = socket.handshake.auth.username;

    if (!username) {
        return next(new Error("Invalid username"))
    }

    socket.username = username;

    connectedUsers.set(socket.id, { id: socket.id, username }); // Add user to the connectedUsers map

    next();
});

const clients = []

io.on("connection", (socket) => {

    socket.join(socket.username);

    io.emit("users", Array.from(connectedUsers.values()));

    socket.on("sent-message", (msg) => {

        const message = {
            body: msg.body,
            sender: socket.username,
            senderId:msg.senderId,
            recipient: msg.recipientName,
            recipientId:msg.recipientId,
            sentAt: new Date(Date.now())
        } 
                                    
        io.to(message.recipientId).emit("message-response", message);

        io.to(socket.id).emit("message-response", message);
    })

    socket.on("disconnect", () => {
        connectedUsers.delete(socket.id);

        io.emit("users", Array.from(connectedUsers.values()));
    });
})

server.listen(port, () => {
    console.log(`Server running at port ${port}`)
});


