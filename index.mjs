import _ from 'lodash';
import Koa from 'koa';
import route from 'koa-route';
import ws from 'koa-websocket';
import fs from 'koa-static';
import { device, setFrequency, setMode, eventBus, connect, receive, frequency, mode, tuningFreq } from './src/sdr.mjs';

const app = ws(new Koa());
app.use(fs('./dist'));

const sdrLoop = _.once((async function() {
  console.log('Connect to sdr device...');
  await connect();
  await receive();
}))

app.ws.use(route.all('/data', ctx => {
  sdrLoop();

  function sendInfoToClient() {
    ctx.websocket.send(JSON.stringify({ ts: Date.now(), device: device.value, frequency: frequency.value, mode: mode.value, tuningFreq: tuningFreq.value }));
  }

  function sendSdrDataToClient(data) {
    const { left, right, signalLevel, ts, frequency } = data;
    const buf = new ArrayBuffer(left.byteLength + right.byteLength + 8 * 2 + 4)
    new Uint8Array(buf, 0, left.byteLength).set(new Int8Array(left))
    new Uint8Array(buf, left.byteLength, right.byteLength).set(new Int8Array(right))
    const dv = new DataView(buf)
    dv.setFloat64(left.byteLength + right.byteLength, signalLevel)
    dv.setFloat64(left.byteLength + right.byteLength + 8, ts)
    dv.setUint32(left.byteLength + right.byteLength + 16, frequency)
    ctx.websocket.send(buf)
  }

  ctx.websocket.on('message', function(message) {
    message = JSON.parse(message.toString());
    switch (message.type) {
      case 'frequency':
        setFrequency(message);
        break;
      case 'mode':
        setMode(message);
        break;
      case 'init':
        sendInfoToClient();
        eventBus.on('sdr_data', sendSdrDataToClient);
        ctx.websocket.on('close', () => {
          console.log('socket closed');
          eventBus.off('sdr_data', sendSdrDataToClient);
        });
        break;
    }
  });
}))

console.log('Listen on port 3000')
app.listen(3000);
