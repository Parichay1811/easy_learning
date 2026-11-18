// Headers for API responses (FND-074). The site itself is served by nginx.
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), geolocation=(), payment=()',
    // Responses are about one signed-in person: never cache them in shared caches.
    'Cache-Control': 'no-store',
  })
  next()
}

module.exports = { securityHeaders }
