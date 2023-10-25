const express = require('express');
const app = express();
const { port } = require('./env-config');
const webSocket = require('ws');
const cors = require('cors');
const { parse } = require('dotenv');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors);

// websocket server
const webSocketServer = new webSocket.Server({
    port: 8080
},
    console.log("The websocket server is running at port 8080")
);

const recentMessages = [];

const users = new Set();

const sendMessage = (message) => {
    
    for (const user of users) {
        user.socket.send(JSON.stringify(message))
    }
}

webSocketServer.on("connection", (socket) => {
    
    const userRef = {
        socket: socket,
        lastSeen:Date.now()
    }

    users.add(userRef);

    socket.on("message", (message) => {
        
        try {

            const parsedMessage = JSON.parse(message);

            if (typeof parsedMessage.sender !== "string" || typeof parsedMessage.body !== "string") {
                console.log("Invalid message. It is not a string", message)

                return 
            }

            const verifiedMessage = {
                sender: parsedMessage.sender,
                body: parsedMessage.body,
                sentAt:Date.now()
            }

            sendMessage(verifiedMessage);
            
        } catch(error) {
            console.log(error)
        }
    })
})


// http server
app.listen(port, () => {
    
    console.log(`Server started at port ${port}`);
});

