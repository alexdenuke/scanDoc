import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import userRouter from './routes/user/user.route'
import uploadsRouter from './routes/file/file.route'
import authorize from './middleware/authorize.middleware'
const mainRouter = Router()

mainRouter.use('/auth', authRouter)
mainRouter.use('/user', authorize, userRouter)
mainRouter.use('/upload', authorize, uploadsRouter)

export default mainRouter
