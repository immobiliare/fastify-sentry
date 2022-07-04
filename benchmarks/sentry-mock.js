'use strict';

const { createServer, STATUS_CODES } = require('http');

const sentryMock = createServer((request, response) => {
  let data = '';
  request.on('data', (chunk) => (data += chunk));
  request.on('end', () => {
    try {
      const payload = JSON.parse(data);
      response.writeHead(201);
      setTimeout(() => response.end(payload.event_id), 10);
    } catch (error) {
      response.statusCode = 500;
      response.end(STATUS_CODES[500]);
    }
  });
  request.on('error', () => {
    response.statusCode = 500;
    response.end(STATUS_CODES[500]);
  });
});

sentryMock.listen(4000);
