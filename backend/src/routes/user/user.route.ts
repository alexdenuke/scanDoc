import { Router } from 'express'
import { deleteOne, findMany, findOne, updateOne } from './user.controller'

const router = Router()

router.route('/').get(findMany)
router.route('/:id').get(findOne).patch(updateOne).delete(deleteOne)

export default router
