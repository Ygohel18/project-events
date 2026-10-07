/**
 * cPanel Phusion Passenger Next.js Production Server
 * File: frontend/server.js
 *
 * Runs the Next.js production build under CloudLinux / cPanel Passenger.
 * Passenger automatically passes the listening port or Unix socket in process.env.PORT.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Next.js production server ready on cPanel port/socket: ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start Next.js production server:', err);
    process.exit(1);
  });
