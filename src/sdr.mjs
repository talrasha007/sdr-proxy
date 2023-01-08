import _ from 'lodash';
import fs from 'fs';
import EventEmitter from 'events'
import RtlSdr from '@sdr.cool/rtlsdrjs'
import decoder from '@sdr.cool/demodulator-wasm'

export const eventBus = new EventEmitter();

function ref(v) {
  return { value: v }
}

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 10
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const AUDIO_RATE = 48 * 1e3

let sdr = null

export const mode = ref('FM')
export const frequency = ref(88.7 * 1e6)
export const tuningFreq = ref(0)
export const latency = ref(0)
export const signalLevel = ref(0)
export const device = ref('')
export const totalReceived = ref(0)

const save = _.debounce(() => {
  fs.writeFileSync('./state.json', JSON.stringify({ mode: mode.value, frequency: frequency.value }));
}, 1000);

try {
  const saved = JSON.parse(fs.readFileSync('./state.json'));
  mode.value = saved.mode
  frequency.value = saved.frequency
} catch(e) {
  console.log('No saved state, use default value.');
}

export async function connect() {
  sdr = await RtlSdr.requestDevice()
  device.value = sdr._usbDevice._device.productName
}

export async function disconnect() {
  const toClose = sdr
  sdr = null
  device.value = ''
  await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
  toClose.close()
}

export async function receive() {
  decoder.setRate(SAMPLE_RATE, AUDIO_RATE)
  decoder.setMode(mode.value)

  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(SAMPLE_RATE)
  await sdr.setCenterFrequency(frequency.value)
  await sdr.resetBuffer()
  let currentFreq = frequency.value
  while (sdr) {
    if (currentFreq !== frequency.value) {
      currentFreq = frequency.value
      await sdr.setCenterFrequency(currentFreq)
      await sdr.resetBuffer()
    }

    const currentTuningFreq = tuningFreq.value
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      setImmediate(() => {
        eventBus.emit('samples', { type: 'samples', samples, ts: Date.now(), frequency: currentFreq, tuningFreq: currentTuningFreq })
      })
      // eventBus.emit('raw_data', { samples, ts: Date.now(), frequency: currentFreq })
    }
  }
}

export async function setFrequency(data) {
  if (frequency.value !== data.frequency || tuningFreq.value !== data.tuningFreq) {
    frequency.value = data.frequency;
    tuningFreq.value = data.tuningFreq;
  }

  save();
}

export async function setMode(data) {
  decoder.setMode(data.mode);
  mode.value = data.mode;
  save();
}

eventBus.on('samples', (data) => {
  const samples = data.samples
  totalReceived.value += samples.byteLength
  let [left, right, sl] = decoder.demodulate(samples, -data.tuningFreq)

  signalLevel.value = sl
  latency.value = Date.now() - data.ts
  eventBus.emit('sdr_data', { type: 'decoded_data', left, right, signalLevel: signalLevel.value, frequency: data.frequency + data.tuningFreq, ts: data.ts });
})