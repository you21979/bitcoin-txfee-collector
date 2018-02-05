const fs = require('fs')
const InsightCli = require('insight-cli')
const InsightRestClient = InsightCli.RestClient;
InsightCli.constant.OPT_KEEPALIVE = true
const task = require("promise-util-task")

const main = async (argv) => {
    const cli = new InsightRestClient();
    const fname = argv[0]
    const list = fs.readFileSync(fname, "utf8").split("\n").filter(v => v !== '')
    const res = await task.limit(list.map( (v) => () => cli.transaction(v) ), 5)
    const data = res.map(v => ({txid:v.txid, count:v.vout.length, fees:v.fees}))
    fs.writeFileSync("out.txt", JSON.stringify(data), "utf8")
}

main(process.argv.slice(2))
