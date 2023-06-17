'use strict'

// Imports
import { WebSocketServer } from 'ws'
import {
  isMainThread,
  parentPort
} from 'worker_threads'


// Throw an error if the script is run as a parent thread
if (isMainThread){
  throw("ERROR: RUN AS WORKER")
}

// Create a websocket server on port 8080
const wss = new WebSocketServer({ port: 8080 })

// Declare a variable that will be used later to determine whether to
// send data to the serial monitor or not
let send = false

// On a websocket connection...
wss.on('connection', (ws) => {

  // Log that a client connected
  console.log("Websocket connected to client")

  // When a message is recieved...
  ws.on('message', (message) => {

    // Clear the console
    console.clear()
    // Log the message
    console.log('received: %s', message);

    // Try to parse it, if not then it's not JSON
    // The try, catch method will prevent execution of code after an error is caught
    // therefore, send will remain false unless JSON.parse runs without an error
    try{
      JSON.parse(`${message}`)
      send = true
    }
    catch(error){
      ws.send(JSON.stringify({error: "Incorrect JSON format"}))
      console.log(error)
    }

    // If JSON.parse was allowed to continue without error, then send should be true
    if (send){ 
      // Send the data over the parent port (to the serial monitor)
      parentPort.postMessage(`${message}`)
      // Reset send to false
      send = false
    }
  });

  // When the serial monitor sends data to this script, immediately pass it on
  parentPort.on('message', message => {
    ws.send(message)
  })
});