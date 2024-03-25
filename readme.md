# BDUSS获取

## workers

在 <https://workers.cloudflare.com> 新建一个workers，将 `workers.js` 的内容复制粘贴就完成了

- 可以设置环境变量或者取消注释设置 `ORIGIN`
- 可以设置环境变量或者取消注释设置 `AllowedReferrer`

## php

- 可以设置 `$origin`

## 示例

`/index.html` 是演示站 <https://bduss.nest.moe> 的源码，要直接使用需要修改或删除下述几项

- api 地址，搜索 `!!! DEPLOY YOUR OWN API ENDPOINT !!!` 找到夹在中间的变量修改值即可，演示站后端随时会失效，请尽量自行部署

## 环境要求

仅限 PHP 版有要求，workers 版直接部署

```txt
php 7.x
php-curl
```

## 关于回调与stoken

- 请将回调链接进行`base64`编码后以`hash`形式添加到连接到网站的链接中
- 默认不提供`stoken`，如果需要请在`query`的`stoken_type`中体现，至于这个`stoken_type`的可用值请自行寻找

参考格式

```javascript
//https://bduss.nest.moe/#/aHR0cHM6Ly9leGFtcGxlLmNvbS8/c3Rva2VuX3R5cGU9dGI=
"https://bduss.nest.moe/#/" + btoa("https://example.com/?stoken_type=tb")//这样会回调会带贴吧的stoken
//---
"https://bduss.nest.moe/#/" + btoa("https://example.com/")//这样会不带stoken
```


## 其他

关于本项目原理可以参考 [扫码登录百度获取BDUSS](https://blog.nest.moe/2018/07/17/scan-qrcode-to-fetch-bduss/)
