import test from 'node:test'
import assert from 'node:assert/strict'
import { scanFramePixels } from '../src/frame-scan.js'

test('reads only map rows, ignores borders, and sounds warm and cool colors on opposite sides of 220 Hz', () => {
  const width = 1920
  const height = 1080
  const data = new Uint8ClampedArray(width * height * 4)
  const put = (x, y, rgb) => data.set([...rgb, 255], (y * width + x) * 4)
  put(820, 1013, [60, 133, 172])
  put(1120, 1013, [191, 106, 57])
  put(118, 117, [191, 106, 57])
  put(122, 117, [207, 207, 207])
  put(126, 117, [10, 7, 5])
  put(118, 838, [60, 133, 172])
  put(1000, 960, [60, 133, 172])

  const { bands } = scanFramePixels({ width, height, data })
  assert.equal(bands.length, 6)
  assert.equal(bands[0].samples, 1)
  assert.equal(bands[0].warm, 1)
  assert.equal(bands[0].frequency, 440)
  assert.equal(bands[5].samples, 1)
  assert.equal(bands[5].cool, 1)
  assert.ok(bands[5].frequency < 220)
  assert.equal(bands[1].frequency, null)
})

test('rejects inputs with the wrong dimensions or missing legend', () => {
  assert.throws(() => scanFramePixels({ width: 960, height: 540, data: [] }), /supported NASA SVS map layout/)
  const width = 1920
  const height = 1080
  const data = new Uint8ClampedArray(width * height * 4)
  assert.throws(() => scanFramePixels({ width, height, data }), /legend/)
})


test('supports the older map layout at archive dimensions and skips its legend inset', () => {
  const width = 1024
  const height = 576
  const data = new Uint8ClampedArray(width * height * 4)
  const put = (x, y, rgb) => {
    const nativeX = Math.round(x * width / 1920)
    const nativeY = Math.round(y * height / 1080)
    data.set([...rgb, 255], (nativeY * width + nativeX) * 4)
  }
  put(78, 1018, [27, 65, 122])
  put(78, 800, [185, 35, 5])
  put(24, 15, [185, 35, 5])
  put(132, 834, [27, 65, 122])

  const { sourceWidth, bands } = scanFramePixels({ width, height, data })
  assert.equal(sourceWidth, 1024)
  assert.equal(bands[0].warm, 1)
  assert.equal(bands[4].samples, 0)
  assert.equal(bands[5].samples, 1)
  assert.equal(bands[5].cool, 1)
})
