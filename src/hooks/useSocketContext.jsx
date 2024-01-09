import { useContext } from "react";
import { SocketContext } from "../context/socketContext";

// custom hook to teleport the socket object
const useSocketContext = () => {
    
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("useSocketContext hook must be used within a SocketContextProvider")
    }

    return context;
}

export default useSocketContext;