const fs = require('fs');
const path = 'patches/aj-captcha-react+1.3.4.patch';
let content = fs.readFileSync(path, 'utf8');

const t1 = "'+(typeof localStorage !== \\'undefined\\' && (localStorage.getItem(\\'ztoken.locale\\') || \\'\\').startsWith(\\'zh\\') ? \\'\\\\u8BF7\\\\u5B8C\\\\u6210\\\\u5B89\\\\u5168\\\\u9A8C\\\\u8BC1\\' : \\'Please complete security verification\\')+'";
const t2 = "'+(typeof localStorage !== \\'undefined\\' && (localStorage.getItem(\\'ztoken.locale\\') || \\'\\').startsWith(\\'zh\\') ? \\'\\\\u5411\\\\u53F3\\\\u6ED1\\\\u52A8\\\\u5B8C\\\\u6210\\\\u9A8C\\\\u8BC1\\' : \\'Swipe right to verify\\')+'";
const t3 = "'+(typeof localStorage !== \\'undefined\\' && (localStorage.getItem(\\'ztoken.locale\\') || \\'\\').startsWith(\\'zh\\') ? \\'\\\\u8BF7\\\\u4F9D\\\\u6B21\\\\u70B9\\\\u51FB\\\\u3016\\' + captcha.word + \\'\\\\u3017\\' : \\'Please click in order: \\' + captcha.word)+'";
const t4 = "'+(typeof localStorage !== \\'undefined\\' && (localStorage.getItem(\\'ztoken.locale\\') || \\'\\').startsWith(\\'zh\\') ? \\'\\\\u6821\\\\u9A8C\\\\u4E2D...\\' : \\'Checking...\\')+'";


content = content.replace(
  /\(typeof localStorage !== 'undefined' && \(localStorage\.getItem\('ztoken\.locale'\) \|\| ''\)\.startsWith\('zh'\) \? '[^']+' : 'Please complete security verification'\)/g,
  t1
);

content = content.replace(
  /\(typeof localStorage !== 'undefined' && \(localStorage\.getItem\('ztoken\.locale'\) \|\| ''\)\.startsWith\('zh'\) \? '[^']+' : 'Swipe right to verify'\)/g,
  t2
);

// Fix points.js corrupted parts if they exist
content = content.replace(
  /"¦Å\?\(Click in order\):"\.concat\(captcha\.word, ""\)/g,
  t3
);

content = content.replace(
  /return 'Ð£Ñé\?\.\.';/g,
  "return " + t4 + ";"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patch file fixed.');
