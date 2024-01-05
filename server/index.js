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

// get all sessions
const allSessions = async () => {
    
    return await redisStore.all((err, sessions) => {
        
        if (err) {
            console.log(err);
        }

        return sessions;
    })
}

// search redisStore for specific session
const userSession = (sessionId) => {
    
    const session = redisStore.get(sessionId, (err, session) => {
                
        if (err) {
            console.log(err)
        }

        return session;
    })

    return session;
}

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
            username: username,
            online:true
        }

        redisStore.set(newSessionId, newSession, (err => {
        
            if (err) console.log(err);
        }));

        socket.sessionID = newSessionId;
        socket.userID = newUserID;
        socket.username = username;
    }

    // redisClient.flushDb();
    
    if (!username) {
        return next(new Error("Invalid username"))
    }

    next();
});

io.on("connection", async (socket) => {
    
    const { sessionID, userID, username } = socket;

    // change status to online
    const previousSession = await userSession(sessionID);

    previousSession.online = true;

    redisStore.set(sessionID, previousSession);

    socket.emit("newSession", { sessionID, userID, username });

    connectedUsers = await allSessions();

    io.emit("users", Array.from(connectedUsers.values()));

    // console.log(Array.from(connectedUsers.values()))

    socket.join(userID);
    
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
    socket.on("user-is-typing", async (typerDetails) => {
        
        const existingSession = await userSession(typerDetails.typerSessionID);

        const updatedSession = {
            ...existingSession,
            typing: true,
            recipient: typerDetails.recipientId,
            typer:typerDetails.typer
        }

        redisStore.set(typerDetails.typerSessionID, updatedSession);

        connectedUsers = await allSessions();
          
        io.emit("users", Array.from(connectedUsers.values()));
        
        io.to(typerDetails.recipientId).emit("user-is-typing", typerDetails);
    });


    socket.on("stop-typing-indicator", (recipient) => {
        
        io.to(recipient.recipientId).emit("stop-typing-indicator");
    })
    

    // update online status once user disconnects
    socket.on("disconnect", async() => {

        const existingSession = await userSession(socket.sessionID);

        existingSession.online = false;

        existingSession.lastSeen = new Date(Date.now())
        
        redisStore.set(socket.sessionID, existingSession);

        connectedUsers = await allSessions();
        
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


