import Koa from 'koa';
import route from 'koa-route';
import ws from 'koa-websocket';
import { eventBus, connect, receive, frequency, mode, tuningFreq } from './src/sdr.mjs';

const app = ws(new Koa());

app.ws.use(route.all('/data', ctx => {
  ctx.websocket.on('message', function(message) {
    console.log(message);
  });

  function sendInfoToClient() {
    ctx.websocket.send(JSON.stringify({ frequency: frequency.value, mode: mode.value, tuningFreq: tuningFreq.value }));
  }

  sendInfoToClient();

  function sendSdrDataToClient(data) {
    const { left, right, signalLevel, ts } = data;
    const buf = new ArrayBuffer(left.byteLength + right.byteLength + 8 * 2)
    new Uint8Array(buf, 0, left.byteLength).set(new Int8Array(left))
    new Uint8Array(buf, left.byteLength, right.byteLength).set(new Int8Array(right))
    const dv = new DataView(buf)
    dv.setFloat64(left.byteLength + right.byteLength, signalLevel)
    dv.setFloat64(left.byteLength + right.byteLength + 8, ts)
    ctx.websocket.send(buf)
  }

  eventBus.on('sdr_data', sendSdrDataToClient);
  ctx.websocket.on('close', () => {
    console.log('socket closed');
    eventBus.off('sdr_data', sendSdrDataToClient);
  });
}))

console.log('Listen on port 3000')
app.listen(3000);

(async function() {
  await connect();
  await receive();
})().catch(console.error);