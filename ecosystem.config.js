const ports = require('./PORTS.json');

module.exports = {
  apps: [
    {
      name: 'tools-all-servers',
      script: 'scripts/serve-all.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};

