import _ from 'lodash';
import fs from 'fs';
import EventEmitter from 'events'
import { decoder } from '@sdr.cool/utils'
import { sdrLoop } from '@sdr.cool/utils'

export const eventBus = new EventEmitter();

export let mode = 'FM'
export let frequency = 88.7 * 1e6
export let tuningFreq = 0

const save = _.debounce(() => {
  fs.writeFileSync('./state.json', JSON.stringify({ mode: mode, frequency: frequency }))
}, 1000)

try {
  const saved = JSON.parse(fs.readFileSync('./state.json'))
  mode = saved.mode
  frequency = saved.frequency
} catch(e) {
  console.log('No saved state, use default value.')
}

export function isRunning() {
  return sdrLoop.isRunning()
}

export function getInfo() {
  return { frequency, tuningFreq, mode, ts: Date.now() }
}

export function start() {
  decoder.setMode(mode)
  sdrLoop.setFrequency(frequency)
  sdrLoop.start((samples, frequency, tuningFreq) => {
    setImmediate(() => eventBus.emit('samples', { ts: Date.now(), samples, frequency, tuningFreq }))
  }, () => tuningFreq).catch((e) => {
    console.error(e)
    sdrLoop.stop().catch(console.error)
  })
}

export async function setFrequency(data) {
  if ((frequency !== data.frequency || tuningFreq !== data.tuningFreq) && (tuningFreq * data.tuningFreq) === 0) {
    frequency = sdrLoop.setFrequency(data.frequency)
    tuningFreq = data.tuningFreq
  }

  save();
}

export async function setMode(data) {
  decoder.setMode(data.mode)
  mode = data.mode
  save();
}

eventBus.on('samples', (data) => {
  const samples = data.samples
  let [left, right, sl, tuning] = decoder.decode(samples, data.frequency, data.tuningFreq)
  if (tuning && tuningFreq !== 0) {
    frequency = tuning.frequency
    tuningFreq = tuning.tuningFreq
    sdrLoop.setFrequency(frequency)
  }

  sl = Math.max(0, Math.min(1, sl))
  eventBus.emit('sdr_data', { ts: data.ts, left, right, signalLevel: sl, frequency: data.frequency, tuningFreq: data.tuningFreq });
})