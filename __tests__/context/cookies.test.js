'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const Koa = require('../..')

describe('ctx.cookies', () => {
  describe('ctx.cookies.set()', () => {
    it('should set an unsigned cookie', async () => {
      const app = new Koa()

      app.use((ctx, next) => {
        ctx.cookies.set('name', 'jon')
        ctx.status = 204
      })

      const res = await request(app.callback())
        .get('/')
        .expect(204)

      const cookie = res.headers['set-cookie'].some(cookie => /^name=/.test(cookie))
      assert.strictEqual(cookie, true)
    })

    describe('with .signed', () => {
      describe('when no .keys are set', () => {
        it('should error', () => {
          const app = new Koa()

          app.use((ctx, next) => {
            try {
              ctx.cookies.set('foo', 'bar', { signed: true })
            } catch (err) {
              ctx.body = err.message
            }
          })

          return request(app.callback())
            .get('/')
            .expect('.keys required for signed cookies')
        })
      })

      it('should send a signed cookie', async () => {
        const app = new Koa()

        app.keys = ['a', 'b']

        app.use((ctx, next) => {
          ctx.cookies.set('name', 'jon', { signed: true })
          ctx.status = 204
        })

        const res = await request(app.callback())
          .get('/')
          .expect(204)

        const cookies = res.headers['set-cookie']

        assert.strictEqual(cookies.some(cookie => /^name=/.test(cookie)), true)
        assert.strictEqual(cookies.some(cookie => /(,|^)name\.sig=/.test(cookie)), true)
      })
    })

    describe('with secure', () => {
      it('should get secure from request', async () => {
        const app = new Koa()

        app.proxy = true
        app.keys = ['a', 'b']

        app.use(ctx => {
          ctx.cookies.set('name', 'jon', { signed: true })
          ctx.status = 204
        })

        const res = await request(app.callback())
          .get('/')
          .set('x-forwarded-proto', 'https') // mock secure
          .expect(204)

        const cookies = res.headers['set-cookie']
        assert.strictEqual(cookies.some(cookie => /^name=/.test(cookie)), true)
        assert.strictEqual(cookies.some(cookie => /(,|^)name\.sig=/.test(cookie)), true)
        assert.strictEqual(cookies.every(cookie => /secure/.test(cookie)), true)
      })
    })
  })

  describe('ctx.cookies=', () => {
    it('should override cookie work', async () => {
      const app = new Koa()

      app.use((ctx, next) => {
        ctx.cookies = {
          set (key, value) {
            ctx.set(key, value)
          }
        }
        ctx.cookies.set('name', 'jon')
        ctx.status = 204
      })

      await request(app.callback())
        .get('/')
        .expect('name', 'jon')
        .expect(204)
    })
  })
})
