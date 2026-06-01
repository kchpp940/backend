const http = require('http');

const port = process.env.PORT || 3000;
const timeout = parseInt(process.env.HEALTHCHECK_TIMEOUT || '2000', 10);

const options = {
  host: 'localhost',
  method: 'GET',
  path: '/health',
  port,
  timeout,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error(`Health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
