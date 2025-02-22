import { Router } from 'express'
import { signinVKUser, signinYandexUser, signup } from './auth.controller'

const router = Router()

// router.post('/', signin)
router.post('/', signup)
router.post('/userVk', signinVKUser)
router.post('/userY', signinYandexUser)

export default router
