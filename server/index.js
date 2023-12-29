const express = require('express');
const app = express();
const cors = require('cors');
const { port } = require('./env-config');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const { session_secret } = require('./env-config');
const socketSession = require('express-socket.io-session');
const cookieParser = require('cookie-parser');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

const server = http.createServer(app);

// const oneDay = 1000 * 3600 * 24;

// initialize redis client
const redisClient = createClient();

redisClient.connect();

// initialize redisStore
const redisStore = new RedisStore({
    client:redisClient
})

const sessionMiddleware = session({
    store: redisStore,
    saveUninitialized: true,
    resave: false,
    secret: session_secret,
})

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

io.use(async (socket, next) => {

    const { sessionID } = socket.handshake.auth;

    const { username } = socket.handshake.auth;

    if (sessionID) {

        // retirieve session
        const storedSession = await new Promise((resolve, reject) => {
            
            redisStore.get(sessionID, (err, retrievedSession) => {
                
                if (err) {
                    reject("Err:", err)
                }

                resolve(retrievedSession);
            })
        });

        if (storedSession) {

            console.log(storedSession)
            socket.sessionID = storedSession.sessionID;
            socket.userID = storedSession.userID;
            socket.username = storedSession.username;
        } 

    } else {
        
        // persist session if none is found in redis store
        const newSessionId = socket.handshake.sessionID;
        const newUserID = socket.id;

        const newSession = {
            sessionID: newSessionId,
            userID: newUserID, 
            username: username
        }

        redisStore.set(newSessionId, newSession, (err => {
        
            if (err) console.log(err);
        }));

        socket.sessionID = newSessionId;
        socket.userID = newUserID;
        socket.username = username;
    }
    
    // redisStore.all((err, sessions) => {
        
    //     console.log(sessions);
    // }); 

    // redisClient.flushDb();

    if (!username) {
        return next(new Error("Invalid username"))
    }

    connectedUsers.set(socket.userID, { id: socket.userID, username, online:true});

    next();
});

io.on("connection", (socket) => {

    const { sessionID, userID, username } = socket;

    io.emit("users", Array.from(connectedUsers.values()));

    socket.emit("newSession", { sessionID, userID, username });

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

        io.to(userID).emit("message-response", message); 
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


    socket.on("stop-typing-indicator", (recipient) => {
        
        io.to(recipient.recipientId).emit("stop-typing-indicator");
    })
    

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

// check for redis server errors
redisClient.on("error", (err) => {
    
    console.log(`Redis Server Error: \n ${err}`)
})


