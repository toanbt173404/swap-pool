import { initSdk } from "./config"

export const fetchRpcPoolInfo = async () => {
  const raydium = await initSdk();
  console.log('raydium: ', raydium.connection)
  // SOL-RAY
  const pool1 = '9LrM2MVA7FYYZQQayenMya9VzmG27XUEgLQq43eqqDCZ'

  const res = await raydium.cpmm.getRpcPoolInfos([pool1])

  const pool1Info = res[pool1]

  console.log('SOL-RAY pool price:', pool1Info.poolPrice)
  console.log('cpmm pool infos:', res)
}
