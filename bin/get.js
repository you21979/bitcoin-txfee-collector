const fs = require('fs')
const InsightRestClient = require('insight-cli').RestClient;
const task = require("promise-util-task")

const main = async (argv) => {
    const cli = new InsightRestClient();
    const fname = argv[0]
    const list = fs.readFileSync(fname, "utf8").split("\n").filter(v => v !== '')
    const res = await task.limit(list.map( (v) => () => cli.transaction(v) ), 5)
    const data = res.map(v => ({txid:v.txid, count:v.vout.length, fees:v.fees}))
    console.log(data)
}

main(process.argv.slice(2))
