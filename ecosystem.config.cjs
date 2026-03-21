/**
 * PM2 на VPS: стабильнее DNS (Yandex/IPv6 иногда дают ENOTFOUND для *.supabase.co).
 * Запуск: из /var/www/kotocard → pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'kotocard',
      cwd: '/var/www/kotocard',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--dns-result-order=ipv4first',
      },
    },
  ],
};
