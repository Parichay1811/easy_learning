// Test-only preload (harness start({ preload: [require.resolve('./fake-firebase')] })):
// makes the real sign-in endpoints verify tokens against a key the test owns, instead
// of Google's certificates. Production code is untouched: this patches the
// documented `deps.fetchCerts` hook of utils/firebaseToken.js inside the child process.
const path = require('path')
const firebase = require(path.join(__dirname, '..', '..', 'utils', 'firebaseToken'))

const key = process.env.TEST_FIREBASE_PUBLIC_KEY
if (!key) throw new Error('fake-firebase needs TEST_FIREBASE_PUBLIC_KEY')
firebase.deps.fetchCerts = async () => ({ certs: { 'test-kid': key }, ttlMs: 3600 * 1000 })

// The test signs Firebase-shaped ID tokens with the matching private key
// (see idToken() in admin-school.test.js).
