module.exports = {
  apps: [
    {
      name: 'fabric-server',
      cwd: './server',
      script: 'index.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
