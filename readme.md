# BDUSS获取

## workers 后端

在 <https://workers.cloudflare.com> 新建一个workers，将 `workers.js` 的内容复制粘贴就完成了

### 环境变量

| 变量名    | 默认值   | 格式                                                                   | 备注                                                                                       |
| :-------- | :------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `REFERER` | `*`      | `http://example.com/\|https://example.com/`                            | 不需要路径                                                                                 |
| `ROUTER`  | 空字符串 | `http://example.com/\|https://example.com/path/\|https://example.com/` | 即触发路由的部分（建议将 设置 -> 触发器 -> 路由 列表里面的都放进去，注意要去掉正则表达式） |

## ~~php 后端~~

- 可以设置 `$origin`

精力有限，不再维护 PHP 版后端，源码锁定

## 示例

`/index.html` 是演示站 <https://bduss.nest.moe> 的源码，要直接使用需要修改或删除下述几项

- api 地址，搜索 `!!! DEPLOY YOUR OWN API ENDPOINT !!!` 找到夹在中间的变量修改值即可，演示站后端已开访问校验，请尽量自行部署后端

## 环境要求

仅限 PHP 版有要求，workers 版直接部署

```txt
php 7.x
php-curl
```

## 关于回调与stoken

- 请将回调链接进行`base64`/`base64url`编码后以`hash`形式添加到连接到网站的链接中
- 默认不提供`stoken`，如果需要请在`query`/`hash`的`stoken_type`中体现，至于这个`stoken_type`的可用值请自行寻找

参考格式

```javascript
// query 回调带 stoken
// https://bduss.nest.moe/#/aHR0cHM6Ly9leGFtcGxlLmNvbS8/c3Rva2VuX3R5cGU9dGI=
// https://bduss.nest.moe/#/aHR0cHM6Ly9leGFtcGxlLmNvbS8_c3Rva2VuX3R5cGU9dGI
"https://bduss.nest.moe/#/" + btoa("https://example.com/?stoken_type=tb")/
// https://example.com/?stoken_type=tb&bduss=...&stoken=...

// hash 回调带 stoken
// https://bduss.nest.moe/#/aHR0cHM6Ly9leGFtcGxlLmNvbS8jL3N0b2tlbl90eXBlPXRi
"https://bduss.nest.moe/#/" + btoa("https://example.com/#/stoken_type=tb")
// https://example.com/#/stoken_type=tb&bduss=...&stoken=...

// query 回调不带 stoken
// https://bduss.nest.moe/#/aHR0cHM6Ly9leGFtcGxlLmNvbS8
"https://bduss.nest.moe/#/" + btoa("https://example.com/")
// https://example.com/?stoken_type=tb&bduss=...
```


## 其他

关于本项目原理可以参考 [扫码登录百度获取BDUSS](https://blog.nest.moe/2018/07/17/scan-qrcode-to-fetch-bduss/)
