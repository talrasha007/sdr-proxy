import _ from 'lodash';
import Koa from 'koa';
import route from 'koa-route';
import ws from 'koa-websocket';
import fs from 'koa-static';
import { device, setFrequency, setMode, eventBus, connect, receive, frequency, mode, tuningFreq } from './src/sdr.mjs';

const app = ws(new Koa());
app.use(fs('./dist'));

let sdrRunning = false;
async function sdrLoop() {
  if (!sdrRunning) {
    try {
      sdrRunning = true;
      console.log('Connect to sdr device...');
      await connect();
      await receive();
    }
    catch(e) {
      console.error(e.message || e);
    }
    finally {
      console.log('sdrLoop is no longer running');
      sdrRunning = false;
    }
  }
}

app.ws.use(route.all('/data', ctx => {
  sdrLoop();

  function sendInfoToClient() {
    ctx.websocket.send(JSON.stringify({ ts: Date.now(), device: device.value, frequency: frequency.value, mode: mode.value, tuningFreq: tuningFreq.value }));
  }

  let sending = 0
  let drop = 0
  const logDrop = _.debounce(() => {
    console.log(new Date(), 'drop:', drop)
    drop = 0
  }, 1000)

  function wsSend(buf) {
    if (sending === 0) {
      sending = 1
      ctx.websocket.send(buf, () => { sending = 0 })
    } else {
      logDrop(drop++)
    }
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
    wsSend(buf)
  }

  function sendRawDataToClient(data) {
    const { samples, ts, frequency } = data;
    const buf = new ArrayBuffer(samples.byteLength + 8 + 4)
    new Uint8Array(buf, 0, samples.byteLength).set(new Int8Array(samples))
    const dv = new DataView(buf)
    dv.setFloat64(samples.byteLength, ts)
    dv.setUint32(samples.byteLength + 8, frequency)
    wsSend(buf)
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
        eventBus.on('raw_data', sendRawDataToClient);
        const checkInterval = setInterval(() => { if (!sdrRunning) ctx.websocket.close() }, 1000);
        ctx.websocket.on('close', () => {
          clearInterval(checkInterval);
          console.log('socket closed');
          eventBus.off('raw_data', sendRawDataToClient);
        });
        break;
    }
  });
}))

const port = process.env.PROD ? 80 : 3000
console.log(`Listen on port ${port}`)
app.listen(port);
