const rp = require("request-promise")
const sleep = require("@you21979/promise-sleep")
const fs = require("fs")

const getinfo = (txdata) => {
    return {txid:txdata.txid, count:txdata.vout.length, fees:txdata.fees}
}

const txget = async (context, txid) => {
    const cache = context.cache_tbl.filter( v => v[0] === txid ).shift()
    if(cache){
        context.isWait = false
        return cache[1]
    } else {
        context.isWait = true
        const txdata = await rp({
            url: context.INSIGHT_URL + "/tx/" + txid,
            forever: true,
        }).then( JSON.parse )
        context.cache_tbl.push([ txid, txdata ])
        if(context.cache_tbl.length > context.cache_size){
            context.cache_tbl = context.cache_tbl.slice(context.cache_tbl.length - context.cache_size, context.cache_tbl.length )
        }
        return txdata
    }
}

const datagetmain = async (context, txs) => {
    const results = []
    const keys = txs
    for(let i = 0; i < keys.length; ++i){
        const txid = keys[i]
        try{
            const txdata = await txget(context, txid)
            const info = getinfo(txdata)
            console.log(info)
            results.push(info)
        }catch(e){
            console.log(e)
            // retry
            --i
            await sleep(context.INSIGHT_ERROR_WAIT)
        }
        if(context.isWait) await sleep(context.INSIGHT_WAIT)
    }
    return results
}

const proc = async(context) => {
    const txs = fs.readFileSync(context.input_file, "utf-8").split("\n").filter(v => v !== '')
    const infos = await datagetmain(context, txs);
    fs.writeFileSync(context.output_file, infos.map(v => [v.txid,v.count,v.fees].join(",")).join("\n"), "utf-8")
}

const main = async() => {
    const context = {
        INSIGHT_URL : process.env['INSIGHT_URL'] || "https://insight.bitpay.com/api",
        INSIGHT_WAIT : process.env['INSIGHT_WAIT'] || 1000,
        INSIGHT_ERROR_WAIT : 3000,
        isWait : false,
        input_file : "./txlist.txt",
        output_file : "./txinfo.txt",
        cache_tbl : [],
        cache_size : 10,
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
    proc(context)
}

main()

