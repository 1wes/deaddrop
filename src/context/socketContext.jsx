import { createContext, useContext, useState } from "react";

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

// custom hook to teleport the socket object
const useSocketContext = () => {
    
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("useSocketContext hook must be used within a SocketContextProvider")
    }

    return context;
}

export {
    useSocketContext
}

export default SocketContextProvider;
