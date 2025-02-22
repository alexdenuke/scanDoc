import crypto from 'crypto'
import fs from 'fs'
import jwt from 'jsonwebtoken'

const PRIVATE_KEY = fs.readFileSync(`${__dirname}/../keys/id_rsa_priv.pem`, 'utf-8')

function issueJWT(user: {
  email: string
  role_name: string
  id: number
  is_subscription: boolean
  cards: any
  username: string
}) {
  const { email, role_name, id, is_subscription, username } = user
  const payload = {
    sub: email,
    iat: Date.now(),
    role_name,
    id,
    is_subscription: is_subscription,
    username,
  }
  const signedJWT = jwt.sign(payload, PRIVATE_KEY, { expiresIn: 30, algorithm: 'RS256' })
  return {
    token: 'Bearer ' + signedJWT,
    expiresIn: 30,
  }
}

function validPassword(password: string, db_hash: string, db_salt: string) {
  var hashVerify = crypto.pbkdf2Sync(password, db_salt, 10000, 64, 'sha512').toString('hex')
  return db_hash === hashVerify
}

function genHash(password: string) {
  var salt = crypto.randomBytes(32).toString('hex')
  var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

  return {
    salt: salt,
    hash: genHash,
  }
}

export { issueJWT, genHash, validPassword }
