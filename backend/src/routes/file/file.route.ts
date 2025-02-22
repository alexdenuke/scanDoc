import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { uploadFile } from './file.controller'

const router = Router()
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({ storage })

router.post('/', upload.single('file'), uploadFile)

export default router
