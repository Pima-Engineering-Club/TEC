'use strict'

// Imports
import {
  Worker
} from 'worker_threads'

import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

// For some reason, I cannot import prompt normally without this weird workaround
import pkg from 'prompt-sync'
const prompt = pkg()

// declare count as an empty array
let count = []

//----------------//

// Autodetect Arduino Nano
function autodetect(ports){
  // Declare path, because returning in the forEach function doesn't return the autodetect function
  let path

  ports.forEach((port) => {
    // 7523 represents the product ID for the Arduino Nano
    // Could be modified to autodetect more board types
    if (port.productId == 7523){
      // if the productId matches, get the path of the board
      path = port.path
    }
  });

  // If it's not undefined, that means that it exists (go figure)
  if (typeof path !== 'undefined'){
    // Log the path and return, preventing further execution
    console.log(`Arduino Nano automatically detected on ${path}`)
    return path
  }

  // If the statement above didn't return, then path is undefined, meaning either
  // autodetect failed, or the board isn't showing up for some reason
  console.log('Autodetect failed...')
  console.log('Paths detected: ')
  
  // List off all the paths
  ports.forEach((port) => {
    console.log(port.path)
  });

  // ask the user to enter the path manually
  return prompt('Enter path manually: ')
}

// Average function that gets the average of an array
// Definitely didn't steal this one from the internet
const average = array => array.reduce((a, b) => a + b) / array.length

//----------------//

// List all the connected ports and wait for it to finish
// The .then() prevents it from returning a promise
SerialPort.list().then((ports) => {

// Run the autodetect() function on the list and set the path to the output
const port = autodetect(ports)

// This returns a nice and easy single value to use
const serialport = new SerialPort({ path: port, baudRate: 9600 }, (err) => {
  // if for whatever reason there's an error, throw it
  if (err) throw err
  console.log(`Successfully connected to ${port}`)})

// Run the websocket-worker.js file as a worker on a seperate thread
const worker = new Worker('./websocket-worker.js');
// On a worker message...
worker.on('message', message => {
  // Log it
  console.log(`Websocket message received: ${message}`)
  // Write it to the serialport
  serialport.write(message, (err) => {
    // If there's an error, log it, otherwise log the success
    if (err) return console.log(`Error wrile writing: ${err.message}`)
    console.log(`Wrote to board: ${message}`)
  })
});

// If the worker has an error, throw it. We don't want this to continue running while the worker is broken
worker.on('error', err => {throw err});

// Start a datastream parser that uses the return carrage and newline as the delimiter (where to end the data)
const parser = serialport.pipe(new ReadlineParser({ delimiter: '\r\n' }))
// Declare send
let send = false
// When the delimiter is seen, parse that as one chunk of data
parser.on('data', (data) => {
  // try, catch because sometimes the data gets sent too early on startup and we're left
  // with an incomplete buffer which *will* cause an error
  try {
    data = JSON?.parse(data.toString()) //Convert to JSON
    send = true
  }catch{}

  if (data?.tempc != -1.0625){
    if (count.length >= 9){
      worker.postMessage(JSON.stringify({tempc: average(count)}))
      count = []
    }
    count.push(data?.tempc)
  }
  send = false
})
});