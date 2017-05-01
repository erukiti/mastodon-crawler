const fs = require('fs')
const path = require('path')
const Masto = require('mastodon-api')
const fetch = require('node-fetch')
const mkdirp = require('mkdirp')

const M = new Masto({
    'access_token': process.env['MASTODON_ACCESS'],
    'timeout_ms': 60 * 1000,  // optional HTTP request timeout to apply to all requests.
    'api_url': process.env['MASTODON_API_URL'], // optional, defaults to https://mastodon.social/api/v1/
})

const padding = s => `0${s}`.substr(-2)

const dlPath = process.env['DLPATH']

const listener = M.stream('streaming/public/local')
listener.on('message', msg => {
    if (msg.event === 'delete') {
        return
    }

    msg.data['media_attachments'].forEach(media => {
        console.log(media.url)
        if (media.type !== 'image') {
            console.log(media.type)
            return
        }

        fetch(media.url).then(res => {
            const date = new Date()
            const day = `${date.getFullYear()}-${padding(date.getMonth() + 1)}-${padding(date.getDate())}`
            try {
                const filename = path.join(dlPath, day, path.basename(media.url))
                mkdirp(path.dirname(filename))

                const dest = fs.createWriteStream(filename)
                res.body.pipe(dest)
            } catch (e) {
                console.log(e)
            }
        })
    })
})
listener.on('error', err => console.log(err))
