import { Request, Response, query } from 'express'
import { pool } from '../../connection'
import { BadRequestError, NotFoundError } from '../../errors'
import { StatusCodes } from 'http-status-codes'

export async function findMany(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT users.id, users.limit_req_ill,users.is_email, users.first_name, users.last_name, users.username, users.email, users.is_subscription, users.about, role.role_name, users.new_avatar, limit_create_cards, subscription_date, limit_subs, avatars.path as default_avatar
    FROM users
    INNER JOIN role ON users.role = role.id
    INNER JOIN avatars ON users.default_avatar = avatars.id
WHERE users.id = $1;`

  const result = await pool.query(query, [id])

  if (!result || result.rowCount == null || result.rowCount <= 0) {
    throw new NotFoundError('Пользователь не найден')
  }

  return res.json(result.rows[0])
}

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * from users
WHERE users.id = $1;`

  const result = await pool.query(query, [id])

  if (!result || result.rowCount == null || result.rowCount <= 0) {
    throw new NotFoundError('Пользователь не найден')
  }

  return res.json(result.rows[0])
}

export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { first_name, last_name, email, signatures } = req.body

  if (!first_name && !last_name && !email && !signatures) {
    throw new BadRequestError('Не указаны данные для обновления')
  }

  let query = `UPDATE users SET `
  let queryParams: (string | number | boolean | null)[] = []
  let setClauses: string[] = []

  if (first_name !== undefined) {
    setClauses.push(`first_name=$${queryParams.length + 1}`)
    queryParams.push(first_name)
  }

  if (last_name !== undefined) {
    setClauses.push(`last_name=$${queryParams.length + 1}`)
    queryParams.push(last_name)
  }

  if (email !== undefined) {
    setClauses.push(`email=$${queryParams.length + 1}`)
    queryParams.push(email)
  }

  if (signatures !== undefined) {
    setClauses.push(`signatures=$${queryParams.length + 1}`)
    const serializedBlocks = JSON.stringify(signatures)
    queryParams.push(serializedBlocks)
  }

  if (setClauses.length === 0) {
    throw new BadRequestError('Не указаны данные для обновления')
  }

  query += setClauses.join(', ')
  query += ` WHERE id=$${queryParams.length + 1}`
  queryParams.push(id)

  console.log('Query:', query)
  console.log('Params:', queryParams)

  const result = await pool.query(query, queryParams)

  if (result.rowCount === 0) {
    throw new BadRequestError('Ошибка изменения данных')
  }

  return res.status(StatusCodes.OK).json({ message: 'Успешно обновлено' })
}

export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = 'DELETE FROM users WHERE id = $1'
  const result = await pool.query(query, [id])

  if (!result || result.rowCount == null) {
    throw new NotFoundError(`Пользователь с id = ${id} не найден`)
  }

  return res.status(StatusCodes.OK).json({ message: 'Пользователь успешно удален' })
}
