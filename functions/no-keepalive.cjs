// https://github.com/firebase/firebase-tools/issues/8304
// Needed to run firebase login on Node 24
// $env:NODE_OPTIONS = "--require .\no-keepalive.cjs"
// firebase login
require('http').globalAgent.keepAlive = false;
require('https').globalAgent.keepAlive = false;
