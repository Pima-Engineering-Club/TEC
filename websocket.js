'use strict'

import { WebSocketServer } from 'ws';

import {
  Worker,
  isMainThread,
  parentPort,
  workerData
} from 'worker_threads'

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});