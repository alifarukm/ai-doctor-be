import { Hono } from 'hono'
import prismaClients from '../lib/prisma/index'

type Bindings = {
  MY_KV: KVNamespace
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


app.get('/', async (c) => {
  const prisma = await prismaClients.fetch(c.env.DB)
  const users = await prisma.user.findMany()
  console.log('users', users)
  return c.json(users)
})

export default app
