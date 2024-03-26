'use strict'
//const ORIGIN = ''//Environment Variables
const AllowedReferrer = ''// 'a.com|b.com|c.com' multiple domains is supported
const init = {
    status: 403,
    headers: {
        'content-type': 'application/json;charset=UTF-8',
        'access-control-allow-origin': (typeof ORIGIN !== 'undefined') ? ORIGIN : '*',
        'access-control-allow-methods': 'GET',
        'X-XSS-Protection': '1; mode=block',
        'X-Frame-Options': 'sameorigin',
    },
}

const globalHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
})

const callback = "get_object_value"

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
                if (resp.data.status >= 0 && resp.data.status <= 2) {
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
    const response = await (await fetch("https://passport.baidu.com/v2/api/getqrcode?lp=pc", { headers: globalHeaders })).json()
    return { sign: response.sign, imgurl: response.imgurl }
}

async function getBduss(sign, full = false) {
    let resp = { status: 1, bduss: "", msg: "", fullmode: false }
    let response = await (await fetch("https://passport.baidu.com/channel/unicast?channel_id=" + sign + "&callback=" + callback, { headers: globalHeaders })).text()
    if (response) {
        const parsedData = callbackfunc(response)

        const errno = parsedData.errno
        if (errno === 1) {
            resp.status = 1
        } else if (errno === 0) {
            const channel_v = JSON.parse(parsedData.channel_v)
            if (channel_v.status) {
                resp.status = 0
                resp.msg = "Continue"
            } else {
                const userData = callbackfunc(await (await fetch('https://passport.baidu.com/v3/login/main/qrbdusslogin?callback=' + callback + '&bduss=' + channel_v.v, { headers: globalHeaders })).text())

                if (userData && userData.code === "110000") {
                    resp.status = 2
                    resp.msg = "Success"
                    resp.bduss = userData.data.session.bduss
                    if (full) {
                        resp.fullmode = true
                        resp.data = {
                            ptoken: userData.data.session.ptoken,
                            stoken: userData.data.session.stoken,
                            ubi: userData.data.session.ubi,
                            hao123Param: userData.data.hao123Param,
                            username: userData.data.user.username,
                            userId: userData.data.user.userId,
                            portraitSign: userData.data.user.portraitSign,
                            displayName: userData.data.user.displayName,
                            stokenList: parseStoken(userData.data.session.stokenList)
                        }
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

function parseStoken(stokenList) {
    return Object.fromEntries(JSON.parse(stokenList.replace(/&quot;/gm, '"')).map(x => x.split('#')))
}

function callbackfunc(callback_str) {
    return Function(`const ${callback} = (obj) => obj; return ${callback_str}`)()
}
