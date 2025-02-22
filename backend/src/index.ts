import ConvertAPI from 'convertapi'
import 'express-async-errors'
import express, { Express, urlencoded, json, Request, Response } from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import http from 'http'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import errorHandler from './middleware/error-handler.middleware'
import mainRouter from './mainRouter'

dotenv.config()

const app: Express = express()
const server = http.createServer(app)

app.use(cors())
app.use(urlencoded({ extended: true }))
app.use(json())
app.use(morgan('short'))

const uploadsDir = path.resolve(__dirname, '../uploads')

app.use('/uploads', express.static(uploadsDir))
app.use('/fonts', express.static(path.join(__dirname, '../fonts')))

app.get('/', (req: Request, res: Response) => res.send('Server working!'))
app.use('/api', mainRouter)

app.use(errorHandler)

const convertapiSecret = process.env.CONVERT_API_SECRET
if (!convertapiSecret) {
  console.error('Необходимо установить переменную окружения CONVERT_API_SECRET')
  process.exit(1)
}
const convertapi = new ConvertAPI(convertapiSecret)

const convertToPDF = async (filePath: string, fileType: string, outputDir: string): Promise<string> => {
  try {
    console.log(`Начало конвертации файла: ${filePath} типа: ${fileType}`)
    const result = await convertapi.convert('pdf', { File: filePath }, fileType)
    console.log(`Конвертация завершена. Сохранение файлов в: ${outputDir}`)
    const savedFiles = await result.saveFiles(outputDir)
    console.log(`Файлы сохранены: ${savedFiles}`)
    const originalFileName = path.basename(savedFiles[0])
    const fileExtension = path.extname(originalFileName)
    const fileNameWithoutExt = path.basename(originalFileName, fileExtension)
    const timestamp = Date.now()
    const newFileName = `${fileNameWithoutExt}_${timestamp}.pdf`
    const oldPath = path.join(outputDir, originalFileName)
    const newPath = path.join(outputDir, newFileName)
    fs.renameSync(oldPath, newPath)
    console.log(`Файл переименован: ${newFileName}`)
    return newFileName
  } catch (error) {
    console.error('Ошибка в convertToPDF:', error)
    throw error
  }
}

const downloadFile = async (fileUrl: string, downloadPath: string): Promise<void> => {
  try {
    console.log(`Скачивание файла по URL: ${fileUrl}`)
    const writer = fs.createWriteStream(downloadPath)
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 300
      },
    })
    return new Promise((resolve, reject) => {
      response.data.pipe(writer)
      let error: Error | null = null
      writer.on('error', (err) => {
        error = err
        writer.close()
        console.error('Ошибка при записи файла:', err)
        reject(err)
      })
      writer.on('close', () => {
        if (!error) {
          console.log(`Файл успешно скачан: ${downloadPath}`)
          resolve()
        }
      })
    })
  } catch (error) {
    console.error('Ошибка в downloadFile:', error)
    throw error
  }
}

app.post('/convert', async (req: Request, res: Response) => {
  const { file } = req.body

  if (!file) {
    return res.status(400).json({ error: 'Параметр file обязателен' })
  }

  try {
    new URL(file)
  } catch (err) {
    return res.status(400).json({ error: 'Неверный формат URL' })
  }

  const allowedExtensions = ['.docx', '.doc', '.xlsx', '.xls']
  const parsedPath = path.parse(file)
  const fileExtension = parsedPath.ext.toLowerCase()

  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ error: 'Неподдерживаемый тип файла. Поддерживаются: doc, docx, xls, xlsx' })
  }

  const outputDir = uploadsDir
  const originalFileName = path.basename(parsedPath.base, fileExtension)
  const timestamp = Date.now()
  const newFileName = `${originalFileName}_${timestamp}.pdf`
  const downloadPath = path.join(outputDir, `${originalFileName}_${timestamp}${fileExtension}`)

  try {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`Скачивание файла с URL: ${file}`)
    await downloadFile(file, downloadPath)
    console.log(`Файл скачан: ${downloadPath}`)
    console.log(`Начинается конвертация ${fileExtension.toUpperCase()} -> PDF...`)
    const convertedFileName = await convertToPDF(downloadPath, fileExtension.replace('.', ''), outputDir)
    console.log('Файл успешно переименован:', convertedFileName)
    fs.unlinkSync(downloadPath)
    console.log(`Исходный файл удалён: ${downloadPath}`)
    res.json({
      message: 'Конвертация успешно завершена',
      files: `https://scan-back-production.up.railway.app/uploads/${convertedFileName}`,
    })
  } catch (error) {
    console.error('Ошибка при конвертации:', error)
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath)
      console.log(`Скачанный файл удалён после ошибки: ${downloadPath}`)
    }
    res.status(500).json({ error: 'Ошибка при конвертации файла' })
  }
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
  console.log(`Worker PID: ${process.pid}`)
})
