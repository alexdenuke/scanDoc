import { Request, Response } from 'express'
import { pool } from '../../connection'
import { genHash, issueJWT, validPassword } from '../../utils/auth.utils'
import crypto, { createHash } from 'crypto'
import * as dotenv from 'dotenv'
dotenv.config()
import qs from 'qs'
import { UserSchema } from '../../shared/schemas/user.schema'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'
import axios from 'axios'
import nodemailer from 'nodemailer'
import { validationResult } from 'express-validator'

// default auth
export async function signup(req: Request, res: Response) {
  const { first_name, last_name, email, vk_id, ya_id, google_id, ava } = req.body

  // Проверяем, существует ли пользователь
  const query = `
    SELECT * 
    FROM users 
    WHERE email=$1 OR vk_id=$2 OR ya_id=$3 OR google_id=$4
  `
  const result = await pool.query(query, [email, vk_id, ya_id, google_id])

  if (result.rows.length > 0) {
    console.log('Пользователь найден, выполняем авторизацию...')
    const dbUser = result.rows[0]
    const token = issueJWT(dbUser) // Генерация JWT токена
    return res.status(StatusCodes.OK).json(token)
  }

  // Если пользователь не найден, регистрируем его
  const insertQuery = `
    INSERT INTO users (first_name, last_name, email, vk_id, ya_id, google_id, ava) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *; -- Возвращаем данные нового пользователя
  `
  const queryParams = [first_name, last_name, email, vk_id, ya_id, google_id, ava]
  const insertResult = await pool.query(insertQuery, queryParams)

  const newUser = insertResult.rows[0] // Получаем данные нового пользователя
  const token = issueJWT(newUser) // Генерация JWT токена для нового пользователя

  return res.status(StatusCodes.OK).json(token)
}

export async function signinYandexUser(req: Request, res: Response) {
  const { access_token } = req.body

  try {
    const response = await axios.get('https://login.yandex.ru/info?format=json', {
      headers: {
        Authorization: `OAuth ${access_token}`,
      },
    })

    return res.status(StatusCodes.OK).json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR

      const errorMessage = error.response?.data?.error_description || error.message

      if (status >= 400 && status < 500) {
        return res.status(status).json({ message: errorMessage })
      }

      return res.status(status).json({ message: 'An unexpected error occurred' })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An unexpected error occurred' })
    }
  }
}

export async function signinVKUser(req: Request, res: Response) {
  const { access_token, platform } = req.body // Получаем платформу из тела запроса

  try {
    const response = await axios.post(
      'https://id.vk.com/oauth2/user_info',
      new URLSearchParams({
        access_token: access_token,
        client_id: process.env.VK_CLIENT_ID!,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    // Добавляем платформу в ответ
    return res.status(StatusCodes.OK).json({
      ...response.data, // Данные пользователя от VK
      platform, // Указываем платформу
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An unexpected error occurred' })
    }
  }
}
