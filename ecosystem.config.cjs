/** PM2: запуск через start-server.sh (PATH и next в одном шелле) */
module.exports = {
  apps: [{
    name: 'kotocard',
    cwd: '/var/www/kotocard',
    script: '/var/www/kotocard/start-server.sh',
    interpreter: 'bash',
    env: { NODE_ENV: 'production' },
  }],
};
