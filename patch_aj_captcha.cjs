const fs = require('fs');

function replaceFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (let [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(path, content, 'utf8');
}

replaceFile('node_modules/aj-captcha-react/dist/slider/Slider.js', [
    [/\\u8BF7\\u5B8C\\u6210\\u5B89\\u5168\\u9A8C\\u8BC1/g, "请完成安全验证 / Please complete security verification"],
    [/\\u5411\\u53F3\\u6ED1\\u52A8\\u5B8C\\u6210\\u9A8C\\u8BC1/g, "向右滑动完成验证 / Swipe right to verify"]
]);

replaceFile('node_modules/aj-captcha-react/dist/points/Points.js', [
    [/\\u8BF7\\u5B8C\\u6210\\u5B89\\u5168\\u9A8C\\u8BC1/g, "请完成安全验证 / Please complete security verification"],
    [/\\u8BF7\\u4F9D\\u6B21\\u70B9\\u51FB\\u3016/g, "请依次点击 (Click in order):【"],
    [/\\u3017/g, "】"],
    [/校验中\.\.\./g, "校验中... / Verifying..."],
    [/校验成功/g, "校验成功 / Verification successful"],
    [/校验失败/g, "校验失败 / Verification failed"]
]);

replaceFile('node_modules/aj-captcha-react/dist/captcha/Captcha.js', [
    [/请刷新页面再/g, "请刷新页面重试 / Please refresh to retry"],
    [/用户取消/g, "用户取消 / User canceled"]
]);
console.log('done');
