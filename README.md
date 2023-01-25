# testt
node /index.js


# downloaded plugins
npm install
npm install express
npm install cookie-parser
npm install socket.io
npm install buffer
npm install memory-cache
npm install https
npm install oauth2-server


#OpenSSL key gen.
openssl genpkey -algorithm RSA -out private.key
openssl req -new -key private.key -out certificate.csr
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
openssl x509 -in certificate.crt -outform pem -out certificate.pem
