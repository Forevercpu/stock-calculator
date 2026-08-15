<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import NumberInput from './components/NumberInput.vue'
import { calculateTrade, type FeeSettings, type TradeInput } from './calculator'

const initialTrade: TradeInput = { buyPrice: 10, buyQuantity: 1000, sellPrice: 10.2, sellQuantity: 1000 }
const initialFees: FeeSettings = {
  commissionEnabled: true,
  commissionRate: 0.025,
  minimumCommission: 5,
  stampDutyEnabled: true,
  stampDutyRate: 0.05,
  transferFeeEnabled: true,
  transferFeeRate: 0.001,
}

const trade = reactive<TradeInput>({ ...initialTrade })
const fees = reactive<FeeSettings>({ ...initialFees })
const showFees = ref(false)
const result = computed(() => calculateTrade(trade, fees))
const hasValues = computed(() => trade.buyPrice > 0 && trade.sellPrice > 0 && result.value.matchedQuantity > 0)
const hasUnmatchedQuantity = computed(() => result.value.unmatchedBuyQuantity > 0 || result.value.unmatchedSellQuantity > 0)
const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatMoney = (value: number) => money.format(value)
const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

function clearAll() {
  Object.assign(trade, { buyPrice: 0, buyQuantity: 0, sellPrice: 0, sellQuantity: 0 })
}

function resetFees() {
  Object.assign(fees, initialFees)
}

function swapPrices() {
  ;[trade.buyPrice, trade.sellPrice] = [trade.sellPrice, trade.buyPrice]
}

function syncQuantity() {
  trade.sellQuantity = trade.buyQuantity
}
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <div class="brand">计算器</div>
      <button class="quiet-button" type="button" @click="clearAll">清空</button>
    </header>

    <section class="calculator-grid">
      <div class="panel input-panel">
        <div class="trade-head">
          <strong><i class="buy-dot"></i>买入</strong>
          <span>成交金额 {{ formatMoney(result.buyAmount) }}</span>
        </div>
        <div class="field-grid">
          <NumberInput v-model="trade.buyPrice" label="买入价格" unit="元" :step="0.01" />
          <NumberInput v-model="trade.buyQuantity" label="买入股数" unit="股" :step="100" />
        </div>

        <div class="trade-actions">
          <button type="button" @click="swapPrices">⇅ 交换价格</button><span></span>
        </div>

        <div class="trade-head">
          <strong><i class="sell-dot"></i>卖出</strong>
          <span>成交金额 {{ formatMoney(result.sellAmount) }}</span>
        </div>
        <div class="field-grid">
          <NumberInput v-model="trade.sellPrice" label="卖出价格" unit="元" :step="0.01" />
          <NumberInput v-model="trade.sellQuantity" label="卖出股数" unit="股" :step="100" />
        </div>
        <button class="sync-button" type="button" @click="syncQuantity">卖出股数跟随买入</button>

        <div v-if="hasUnmatchedQuantity" class="notice" role="status">
          按 {{ result.matchedQuantity }} 股计算；
          <template v-if="result.unmatchedBuyQuantity">多买 {{ result.unmatchedBuyQuantity }} 股未计入</template>
          <template v-else>多卖 {{ result.unmatchedSellQuantity }} 股未计入</template>
        </div>

        <div class="fee-block">
          <button class="fee-toggle" type="button" :aria-expanded="showFees" @click="showFees = !showFees">
            <span><b>手续费</b><small>佣金 / 印花税 / 过户费</small></span>
            <span class="chevron" :class="{ open: showFees }">⌄</span>
          </button>
          <div v-if="showFees" class="fee-content">
            <div class="fee-row">
              <label class="switch-line"><input v-model="fees.commissionEnabled" type="checkbox" />佣金</label>
              <label class="compact-field"><span>费率</span><input v-model.number="fees.commissionRate" type="number" min="0" step="0.001" /><b>%</b></label>
              <label class="compact-field"><span>最低</span><input v-model.number="fees.minimumCommission" type="number" min="0" step="1" /><b>元</b></label>
            </div>
            <div class="fee-row">
              <label class="switch-line"><input v-model="fees.stampDutyEnabled" type="checkbox" />卖出印花税</label>
              <label class="compact-field"><span>费率</span><input v-model.number="fees.stampDutyRate" type="number" min="0" step="0.01" /><b>%</b></label>
            </div>
            <div class="fee-row">
              <label class="switch-line"><input v-model="fees.transferFeeEnabled" type="checkbox" />过户费（双向）</label>
              <label class="compact-field"><span>费率</span><input v-model.number="fees.transferFeeRate" type="number" min="0" step="0.001" /><b>%</b></label>
            </div>
            <div class="fee-note"><span>请以券商交割单为准</span><button type="button" @click="resetFees">恢复默认</button></div>
          </div>
        </div>
      </div>

      <aside class="panel result-panel" aria-live="polite">
        <div class="result-top">
          <span>预计净收益</span>
          <strong :class="{ loss: result.netProfit < 0 }">{{ hasValues ? formatMoney(result.netProfit) : '—' }}</strong>
        </div>
        <div class="rate-grid">
          <div><span>净收益率</span><b :class="{ loss: result.netReturnRate < 0 }">{{ hasValues ? formatPercent(result.netReturnRate) : '—' }}</b></div>
          <div><span>价格涨幅</span><b :class="{ loss: result.priceChangeRate < 0 }">{{ hasValues ? formatPercent(result.priceChangeRate) : '—' }}</b></div>
        </div>
        <dl class="result-list">
          <div><dt>毛差价</dt><dd>{{ hasValues ? formatMoney(result.grossProfit) : '—' }}</dd></div>
          <div><dt>每股净收益</dt><dd>{{ hasValues ? formatMoney(result.profitPerShare) : '—' }}</dd></div>
          <div><dt>手续费</dt><dd>{{ hasValues ? formatMoney(result.totalFees) : '—' }}</dd></div>
          <div><dt>保本卖出价</dt><dd>{{ hasValues ? formatMoney(result.breakEvenSellPrice) : '—' }}</dd></div>
          <div><dt>匹配股数</dt><dd>{{ hasValues ? `${result.matchedQuantity} 股` : '—' }}</dd></div>
        </dl>
        <p class="privacy-note">仅在当前页面计算，不保存数据</p>
      </aside>
    </section>
  </main>
</template>
