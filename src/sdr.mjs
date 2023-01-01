import exp from 'constants';
import EventEmitter from 'events'
import RtlSdr from 'rtlsdrjs'
import Decoder from './decode-worker.mjs'

export const eventBus = new EventEmitter();

function ref(v) {
  return { value: v }
}

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 32
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const MIN_FREQ = 5e5
const MAX_FREQ = 8e8

let sdr = null
let decoder = null

export const mode = ref('FM')
export const frequency = ref(88.7 * 1e6)
export const tuningFreq = ref(0)
export const latency = ref(0)
export const signalLevel = ref(0)
export const device = ref('')
export const totalReceived = ref(0)

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
  decoder = decoder || new Decoder()
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
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      setImmediate(() => {
        eventBus.emit('samples', { type: 'samples', samples, ts: Date.now(), frequency: currentFreq })
      })
    }
  }
}

export async function setFrequency(data) {
  if (frequency.value !== data.frequency || tuningFreq.value !== data.tuningFreq) {
    frequency.value = data.frequency;
    tuningFreq.value = data.tuningFreq;
  }
}

export async function setMode(data) {
  decoder.setMode(data.mode);
}

eventBus.on('samples', (data) => {
  const samples = data.samples
  totalReceived.value += samples.byteLength
  let [left, right, sl] = decoder.process(samples, true, -tuningFreq.value)

  signalLevel.value = sl
  // left = new Float32Array(left);
  // right = new Float32Array(right);
  // player.play(left, right, signalLevel.value, 0.15);
  latency.value = Date.now() - data.ts
  eventBus.emit('sdr_data', { type: 'decoded_data', left, right, signalLevel: signalLevel.value, frequency: data.frequency + tuningFreq.value, ts: data.ts });
})