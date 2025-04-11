'use strict'
const responseInit = (referrer = '*') => ({
    status: 403,
    headers: {
        'content-type': 'application/json;charset=UTF-8',
        'access-control-allow-origin': referrer,
        'access-control-allow-methods': 'GET',
        'X-XSS-Protection': '1; mode=block',
        'X-Frame-Options': 'sameorigin',
    },
})

const requestHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
})

// const callback = ''//"get_object_value_" + Date.now()

async function switchRouter(request, env) {
    const parseUrl = new URL(request.url)
    const _searchParams = parseUrl.searchParams
    let resp = {
        "errno": -1,
        "msg": "Forbidden",
        "data": []
    }

    // referrer
    let referrer = env.REFERER ? env.REFERER : '*'
    if (referrer !== '*') {
        referrer = referrer.split('|').find(x => x.trim() === request.headers.get('referer'))
    }

    const respInit = responseInit(referrer)
    if (referrer === '*' || referrer !== undefined) {
        respInit.status = 200
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

    return new Response(JSON.stringify(resp), respInit)
}

async function getqrcode() {
    const response = await (await fetch("https://passport.baidu.com/v2/api/getqrcode?lp=pc", { headers: requestHeaders })).json()
    return { sign: response.sign, imgurl: response.imgurl }
}

async function getBduss(sign, full = false) {
    let resp = { status: 1, bduss: "", msg: "", fullmode: false }
    let response = await (await fetch("https://passport.baidu.com/channel/unicast?channel_id=" + sign + "&callback=a", { headers: requestHeaders })).text()
    if (response) {
        const errno = parseInt(/"errno":([\-0-9]+)(?:,|})/.exec(response)[1])
        if (errno === 1) {
            resp.status = 1
        } else if (errno === 0) {
            const channel_v = JSON.parse(/"channel_v":"(.*)"}\)/.exec(response)[1].replace(/\\/gm, ''))
            if (channel_v.status) {
                resp.status = 0
                resp.msg = "Continue"
            } else {
                const userData = await JSON.parse(((await (await fetch('https://passport.baidu.com/v3/login/main/qrbdusslogin?bduss=' + channel_v.v, { headers: requestHeaders })).text()).replace(/'([^'']+)'/gm, `"$1"`)).replace(/\\&/gm, "&"))

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

// function callbackfunc(callback_str) {
//     return Function(`const ${callback} = (obj) => obj; return ${callback_str}`)()
// }

export default {
    async fetch(request, env) {
        const parseUrl = new URL(request.url)

        // router
        let router = env.ROUTER ? env.ROUTER : ''
        if (router !== '') {
            router = router.split('|').some(x => {
                try {
                    const parsedRouter = new URL(x.trim())
                    return parseUrl.host === parsedRouter.host && parseUrl.pathname === parsedRouter.pathname
                } catch {
                    return false
                }
            })
        } else {
            router = parseUrl.pathname === '/api'
        }

        if (router) {
            // TODO: Add your custom /api/* logic here.
            return await switchRouter(request, env)
        }
        // Otherwise, serve the static assets.
        // Without this, the Worker will error and no assets will be served.
        return env.ASSETS.fetch(request)
    }
}
