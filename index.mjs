import _ from 'lodash';
import Koa from 'koa';
import route from 'koa-route';
import ws from 'koa-websocket';
import fs from 'koa-static'

import { proto } from '@sdr.cool/utils'
import { setFrequency, setMode, eventBus, start, isRunning, frequency, mode, tuningFreq } from './src/sdr.mjs'

const app = ws(new Koa())
app.use(fs('./dist'))

app.ws.use(route.all('/data', ctx => {
  if (!isRunning()) {
    console.log('Start sdr loop...')
    start()
  }

  function sendInfoToClient() {
    ctx.websocket.send(JSON.stringify({ ts: Date.now(), frequency: frequency, mode: mode, tuningFreq: tuningFreq }))
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
    wsSend(proto.encode(data))
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
        // eventBus.on('raw_data', sendRawDataToClient);
        eventBus.on('sdr_data', sendSdrDataToClient)
        const checkInterval = setInterval(() => { if (!isRunning()) ctx.websocket.close() }, 1000);
        ctx.websocket.on('close', () => {
          clearInterval(checkInterval);
          console.log('socket closed');
          eventBus.off('sdr_data', sendSdrDataToClient);
          // eventBus.off('raw_data', sendRawDataToClient);
        });
        break;
    }
  });
}))

const port = process.env.PROD ? 80 : 3000
console.log(`Listen on port ${port}`)
app.listen(port);
