'use strict'
//const ORIGIN = ''//Environment Variables
const AllowedReferrer = ''// 'a.com|b.com|c.com' multiple domains is supported
const init = {
  status: 403,
  headers: {
    'content-type': 'application/json;charset=UTF-8',
    'access-control-allow-origin': (typeof ORIGIN !== 'undefined') ? ORIGIN : '*',
    'access-control-allow-methods': 'GET',
    'X-XSS-Protection' :'1; mode=block',
    'X-Frame-Options': 'sameorigin',
  },
}

addEventListener('fetch', event => {
  return event.respondWith(switchRouter(event.request.url, event))
})

async function switchRouter(url) {
  const parseUrl = new URL(url)
  const _searchParams = parseUrl.searchParams
  let resp = {
    "errno": -1,
    "msg": "Forbidden",
    "data": []
  }
  if (AllowedReferrer === '' || RegExp('(^|\.)(' + AllowedReferrer + ')$').test(parseUrl.host)) {
    init.status = 200
    switch (_searchParams.get("m")) {
      case "getqrcode":
        resp.data = await getqrcode()
        if (resp.data.sign) {
          resp.errno = 0
          resp.msg = "Success"
        }
        break
      case "getbduss":
        resp.data = await getBduss(_searchParams.get("sign"), (_searchParams.get("full") === null ? false : true))
        if (!!resp.data.status === !!resp.data.bduss.length) {
          resp.errno = 0
          resp.msg = "Success"
        } else {
          resp.msg = "Invalid QR Code or timeout"
        }
        break
    }
  }
  
  return new Response(JSON.stringify(resp), init)
}

async function getqrcode() {
  const response = await (await fetch("https://passport.baidu.com/v2/api/getqrcode?lp=pc")).json()
  return { sign: response.sign, imgurl: response.imgurl }
}

async function getBduss(sign, full = false) {
  let resp = { status: 1, bduss: "", msg: "", fullmode: false}
  let response = await (await fetch("https://passport.baidu.com/channel/unicast?channel_id=" + sign + "&callback=")).text()
  if (typeof response !== 'undefined' ? response.length : false) {
    const errno = parseInt(/"errno":([\-0-9]+)(?:,|})/.exec(response)[1])
    if (errno === 0) {
        const channel_v = JSON.parse(/"channel_v":"(.*)"}\)/.exec(response)[1].replace(/\\/gm, ''))
        if (channel_v.status) {
          resp.status = 0
          resp.msg = "Continue"
        } else {
          const userData = await JSON.parse(((await (await fetch('https://passport.baidu.com/v3/login/main/qrbdusslogin?bduss=' + channel_v.v)).text()).replace(/'([^'']+)'/gm, `"$1"`)).replace(/\\&/gm, "&"))
          if (userData && userData.code === "110000") {
            resp.status = 2
            resp.msg = "Success"
            resp.bduss = await userData.data.session.bduss
            if (full) {
              resp.fullmode = true
              let fullModeData = {}
              fullModeData.ptoken = await userData.data.session.ptoken
              fullModeData.stoken = await userData.data.session.stoken
              fullModeData.ubi = await userData.data.session.ubi
              fullModeData.hao123Param = await userData.data.hao123Param
              fullModeData.username = await userData.data.user.username
              fullModeData.userId = await userData.data.user.userId
              fullModeData.portraitSign = await userData.data.user.portraitSign
              fullModeData.displayName = await userData.data.user.displayName
              fullModeData.stokenList = parseStoken(await userData.data.session.stokenList)
              resp.data = fullModeData
            }
          }
        }
    } else {
      resp.status = errno
    }
  } else {
    resp.status = -1
    resp.msg = "Invalid QR Code"
  }
  return resp
}

function parseStoken (stokenList) {
  let tmpStokenList = {}
  JSON.parse(stokenList.replace(/&quot;/gm, '"')).map(x => {
    let tmpX = x.split('#')
    tmpStokenList[tmpX[0]] = tmpX[1]
  })
  return tmpStokenList
}