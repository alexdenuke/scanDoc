import { z } from 'zod'

export const UserSchema = z.object({
  first_name: z.string().min(2, 'Слишком короткое имя'),
  last_name: z.string().min(2, 'Слишком короткая фамилия'),
  username: z.string().min(2, 'Слишком короткая имя пользователя'),
  email: z.string().email('Некорректный адрес электронной почты'),
  password: z
    .string()
    .min(8, 'Слишком короткий пароль')
    .regex(/.*[A-Z].*/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/^(?=.*\d).*$/, 'Пароль должен содержать как минимум одну цифру'),
  role: z.number().optional(),
})
