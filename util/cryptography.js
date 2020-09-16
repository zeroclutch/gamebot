const crypto = require('crypto')

/**
 * Utility module to decode sensitive/hidden data for use, such as quiz answers
 */
module.exports = {
    decrypt: (password=process.env.PASS_KEY, data, encoding='hex') => {
      return new Promise((resolve, reject) => {
        const algorithm = 'aes-192-cbc'
        const key = crypto.scryptSync(password, 'salt', 24)
        const iv = Buffer.alloc(16, 0); // Initialization vector.
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let decrypted = ''

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
}