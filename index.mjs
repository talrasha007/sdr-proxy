import { connect, receive } from './src/sdr.mjs';

(async function() {
  await connect();
  await receive();
})().catch(console.error);