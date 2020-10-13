# BDUSS获取

## workers

在 <https://workers.cloudflare.com> 新建一个workers，将 `workers.js` 的内容复制粘贴就完成了

- 可以设置环境变量或者取消注释设置 `ORIGIN`
- 可以设置环境变量或者取消注释设置 `AllowedReferrer`

## php

- 可以设置 `$origin`

## 示例

`/index.html` 是演示站 <https://bduss.nest.moe> 的源码，要直接使用需要修改或删除下述几项

- `L107` 及 `L108` Google analytics 相关
- `L129` api地址

## 环境要求

仅限 PHP 版有要求，workers 版直接部署

```txt
php 7.x
php-curl
```

## 其他

关于 Google analytics 可以参考 [SukkaW/cloudflare-workers-async-google-analytics](https://github.com/SukkaW/cloudflare-workers-async-google-analytics)

关于本项目原理可以参考 [扫码登录百度获取BDUSS](https://blog.nest.moe/2018/07/17/scan-qrcode-to-fetch-bduss/)
