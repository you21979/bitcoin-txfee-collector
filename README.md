# bitcoin-txfee-collector

## spentcheck

別のウォレットに移動するときにかかった手数料を算出するためにつかう

txid,voutのcsvデータをtxlist.txtとして読み込み
spent_txidをspents_out.txtとして書き出す

環境変数

INSIGHT_URL : insightのURL(デフォルトhttps://insight.bitpay.com/api)
INSIGHT_WAIT : insightに対して連続してリクエストするときに待つミリ秒(デフォルト1000)




