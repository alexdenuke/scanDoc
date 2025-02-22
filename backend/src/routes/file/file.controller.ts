import { Request, Response } from 'express'
import { RequestHandler } from 'express-serve-static-core'

export const uploadFile: RequestHandler = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Файл успешно загружен',
    file: req.file,
    path: `https://scan-back-production.up.railway.app/uploads/${req.file?.filename}`,
  })
  res.status(400).json({ message: 'Ошибка загрузки изображения' })
}
