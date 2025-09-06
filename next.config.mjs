/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  // Aquí puedes añadir otras configuraciones de Next.js si las necesitas en el futuro
};

module.exports = withPWA(nextConfig);
