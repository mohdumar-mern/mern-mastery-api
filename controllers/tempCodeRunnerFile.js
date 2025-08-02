import {createCipheriv, randomBytes} from 'crypto';

const key = randomBytes(32);
  const keyBuffer = Buffer.from(key, 'hex');



const iv = randomBytes(16);

const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);

let encrypted = cipher.update('Hello World', 'utf8');
encrypted += cipher.final('hex');

console.log("encrypted",encrypted);
console.log("key",key);
console.log("iv",iv);
console.log("keyBuffer",keyBuffer);
console.log("cipher",cipher);
console.log("cipher",cipher.update('Hello World', 'utf8', 'hex'));
console.log("cipher",cipher.update('Hello World', 'utf8'));