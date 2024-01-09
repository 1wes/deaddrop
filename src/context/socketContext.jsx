import { createContext, useState } from "react";

// create context object
const SocketContext = createContext();

// create provider
const SocketContextProvider = ({ children }) => {

    const [socket, setSocket] = useState(null);
    
    return (
        <SocketContext.Provider value={{socket, setSocket}}>
            {children}
        </SocketContext.Provider>
    )
}

export {
    SocketContext
}

export default SocketContextProvider;
