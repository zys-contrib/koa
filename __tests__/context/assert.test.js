'use strict'

const { describe, it } = require('node:test')
const context = require('../../test-helpers/context')
const assert = require('node:assert/strict')

describe('ctx.assert(value, status)', () => {
  it('should throw an error', () => {
    const ctx = context()

    try {
      ctx.assert(false, 404)
      throw new Error('asdf')
    } catch (err) {
      assert.strictEqual(err.status, 404)
      assert.strictEqual(err.expose, true)
    }
  })
})
