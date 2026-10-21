/**
 * PM2 process definition for merstat-api.
 *
 * Deployed to the VPS as part of the api/ directory. Run from
 * /var/www/merstat-api with:
 *   pm2 start ecosystem.config.cjs
 *
 * This service is deliberately NOT part of the release cycle. The static site
 * is swapped by symlink and needs no restart, but restarting the API on every
 * content deploy would drop in-flight form submissions for no reason. Update
 * it by hand (git pull + pm2 reload) when api/ changes.
 */
module.exports = {
  apps: [
    {
      name: 'merstat-api',
      script: 'server.mjs',
      cwd: '/var/www/merstat-api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3011',
      },
    },
  ],
};
