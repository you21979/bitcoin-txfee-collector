const rp = require("request-promise")
const sleep = require("@you21979/promise-sleep")
const fs = require("fs")

const prepare = (deposits) => {
    // format
    // txid,vout
    const txouts = deposits.map( v => [v[0],v[1]] )
    const table = txouts.reduce( (r,v) => {
        if(!r[ v[0] ]){
            r[v[0]] = [] 
        }
        r[v[0]].push(v[1])
        return r 
    }, {})
    return table
}

const getspents = (txdata, vouts) => {
    const spents = vouts.map( v => {
        return txdata.vout[v].spentTxId
    }).filter( v => v ? true : false )
    return spents
}

const txget = async (context, txid) => {
    const cache = context.cache_tbl.filter( v => v[0] === txid ).shift()
    if(cache){
        context.isWait = false
        return cache[1]
    } else {
        context.isWait = true
        const txdata = await rp( context.INSIGHT_URL + "/tx/" + txid ).then( JSON.parse )
        context.cache_tbl.push([ txid, txdata ])
        if(context.cache_tbl.length > context.cache_size){
            context.cache_tbl = context.cache_tbl.slice(context.cache_tbl.length - context.cache_size, context.cache_tbl.length )
        }
        return txdata
    }
}

const datagetmain = async (context, txtable) => {
    const results = []
    const keys = Object.keys(txtable)
    for(let i = 0; i < keys.length; ++i){
        const txid = keys[i]
        const vouts = txtable[txid]
        try{
            const txdata = await txget(context, txid)
            const spents = getspents(txdata, vouts)
            console.log(spents)
            spents.forEach(v => {
                results.push(v)
            })
        }catch(e){
            console.log(e)
            // retry
            --i
            await sleep(context.INSIGHT_ERROR_WAIT)
        }
        if(context.isWait) await sleep(context.INSIGHT_WAIT)
    }
    const tbl = results.reduce( (r, v) => {
        r[v] = 1
        return r
    }, {})
    return Object.keys(tbl)
}

const proc = async(context) => {
    const deposits = fs.readFileSync(context.input_file, "utf-8").split("\n").filter(v => v !== '').map( v => v.split(",") )
    const txtable = prepare(deposits)
    const spent_txids = await datagetmain(context, txtable);
    fs.writeFileSync(context.output_file, spent_txids.join("\n"), "utf-8")
}

const main = async() => {
    const context = {
        INSIGHT_URL : process.env['INSIGHT_URL'] || "https://insight.bitpay.com/api",
        INSIGHT_WAIT : process.env['INSIGHT_WAIT'] || 1000,
        INSIGHT_ERROR_WAIT : 3000,
        isWait : false,
        input_file : "./txlist.txt",
        output_file : "./spents_out.txt",
        cache_tbl : [],
        cache_size : 10,
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
    proc(context)
}

main()

