import { TokenCreated, Trade, Migrated, TokenRemoved, GemFun } from "../generated/GemFun/GemFun"
import { Token, Trade as TradeEntity } from "../generated/schema"
import { BigInt, store, Bytes } from "@graphprotocol/graph-ts"

export function handleTokenCreated(event: TokenCreated): void {
  let token = new Token(event.params.token.toHexString())
  
  let contract = GemFun.bind(event.address)
  let coreData = contract.try_tokenCore(event.params.token)
  
  if (!coreData.reverted) {
    token.name = coreData.value.getName()
    token.symbol = coreData.value.getSymbol()
    token.logoHash = coreData.value.getLogoHash()
    token.description = coreData.value.getDescription()
  } else {
    token.name = "Unknown"
    token.symbol = "GEM"
    token.description = ""
    token.logoHash = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000")
  }

  let statsData = contract.try_tokens(event.params.token)
  if (!statsData.reverted) {
      token.sold = statsData.value.getSold()
      token.raised = statsData.value.getRaised()
      token.isMigrated = statsData.value.getMigrated()
      token.isCurveCompleted = statsData.value.getCurveCompleted()
      token.miningReserve = statsData.value.getMiningReserve()
  } else {
      token.raised = BigInt.fromI32(0)
      token.sold = BigInt.fromI32(0)
      token.miningReserve = BigInt.fromI32(0)
      token.isMigrated = false
      token.isCurveCompleted = false
  }

  token.creator = event.params.creator
  token.createdAt = event.block.timestamp
  token.updatedAt = event.block.timestamp
  token.save()
}

export function handleTrade(event: Trade): void {
  let token = Token.load(event.params.token.toHexString())
  if (token) {
    if (event.params.isBuy) {
      token.raised = token.raised.plus(event.params.hashAmt)
      token.sold = token.sold.plus(event.params.memeAmt)
    } else {
      token.raised = token.raised.minus(event.params.hashAmt)
      token.sold = token.sold.minus(event.params.memeAmt)
    }
    
    // Синхронизируем статус кривой (может завершиться в этом трейде)
    let contract = GemFun.bind(event.address)
    let statsData = contract.try_tokens(event.params.token)
    if (!statsData.reverted) {
        token.isCurveCompleted = statsData.value.getCurveCompleted()
        token.miningReserve = statsData.value.getMiningReserve()
    }

    token.updatedAt = event.block.timestamp
    token.save()
  }

  let trade = new TradeEntity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  trade.token = event.params.token.toHexString()
  trade.user = event.params.user
  trade.isBuy = event.params.isBuy
  trade.hashAmt = event.params.hashAmt
  trade.tradeAmt = event.params.memeAmt // Используем tradeAmt для ясности
  trade.timestamp = event.block.timestamp
  trade.save()
}

export function handleMigrated(event: Migrated): void {
  let token = Token.load(event.params.token.toHexString())
  if (token) {
    token.isMigrated = true
    token.isCurveCompleted = true
    token.save()
  }
}

export function handleTokenRemoved(event: TokenRemoved): void {
  store.remove("Token", event.params.token.toHexString())
}
