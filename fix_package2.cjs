const fs = require('fs');
const captchaPath = 'node_modules/aj-captcha-react/dist/captcha/Captcha.js';
let captchaContent = fs.readFileSync(captchaPath, 'utf8');

const t6 = "'+(typeof localStorage !== \\'undefined\\' && (localStorage.getItem(\\'ztoken.locale\\') || \\'\\').startsWith(\\'zh\\') ? \\'\\\\u8BF7\\\\u5237\\\\u65B0\\\\u9875\\\\u9762\\\\u518D\\\\u8BD5\\' : \\'Please refresh to retry\\')+'";

captchaContent = captchaContent.replace(
  /msg = CODE\[repCode\] \|\| '[^']+';/g,
  "msg = CODE[repCode] || " + t6 + ";"
);

fs.writeFileSync(captchaPath, captchaContent, 'utf8');
