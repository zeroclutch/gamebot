import crypto from 'crypto'

/**
 * Utility module to decode sensitive/hidden data for use, such as quiz answers
 */
export const
/**
 * 
 * @param {string} password Passkey for the decryption.
 * @param {string} data The data to decode
 * @param {string} [encoding] The encoding type, for example 'hex'
 */
decrypt = (password=process.env.PASS_KEY, data, encoding='hex') => {
  return new Promise((resolve, reject) => {
    const algorithm = 'aes-192-cbc'
    const key = crypto.scryptSync(password, 'salt', 24)
    const iv = Buffer.alloc(16, 0); // Initialization vector.
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = ''
    let chunk

    decipher.on('readable', () => {
      while (null !== (chunk = decipher.read())) {
        decrypted += chunk.toString('utf8')
      }
    })

    decipher.on('end', () => {
      resolve(decrypted)
    })

    try {
      decipher.write(data, encoding)
      decipher.end()
    } catch (err) {
      reject(err)
    }
  })
}