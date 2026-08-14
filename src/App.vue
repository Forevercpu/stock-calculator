<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { calculateTrade, type FeeSettings, type TradeInput } from './calculator'

const initialTrade: TradeInput = {
  buyPrice: 10,
  buyQuantity: 1000,
  sellPrice: 10.2,
  sellQuantity: 1000,
}

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
const hasValues = computed(
  () => trade.buyPrice > 0 && trade.sellPrice > 0 && result.value.matchedQuantity > 0,
)
const hasUnmatchedQuantity = computed(
  () => result.value.unmatchedBuyQuantity > 0 || result.value.unmatchedSellQuantity > 0,
)

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatMoney(value: number) {
  return money.format(value)
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function clearAll() {
  Object.assign(trade, { buyPrice: 0, buyQuantity: 0, sellPrice: 0, sellQuantity: 0 })
}

function resetFees() {
  Object.assign(fees, initialFees)
}

function swapPrices() {
  const buyPrice = trade.buyPrice
  trade.buyPrice = trade.sellPrice
  trade.sellPrice = buyPrice
}

function syncQuantity() {
  trade.sellQuantity = trade.buyQuantity
}
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="交易差价计算器首页">
        <span class="brand-mark">算</span>
        <span>交易差价计算器</span>
      </a>
      <button class="quiet-button" type="button" @click="clearAll">清空数据</button>
    </header>

    <section class="hero">
      <p class="eyebrow">QUICK TRADE CALCULATOR</p>
      <h1>算清每一次买卖。</h1>
      <p>不接行情，不留记录。输入价格和数量，即刻得到扣除费用后的真实差价。</p>
    </section>

    <section class="calculator-grid">
      <div class="panel input-panel">
        <div class="panel-heading">
          <div>
            <p class="section-index">01</p>
            <h2>交易信息</h2>
          </div>
          <button class="link-button" type="button" @click="swapPrices">交换价格</button>
        </div>

        <div class="trade-section buy-section">
          <div class="trade-label"><span></span>买入</div>
          <div class="field-grid">
            <label>
              <span>买入价格</span>
              <div class="input-wrap"><b>¥</b><input v-model.number="trade.buyPrice" type="number" min="0" step="0.01" inputmode="decimal" /></div>
            </label>
            <label>
              <span>买入数量</span>
              <div class="input-wrap"><input v-model.number="trade.buyQuantity" type="number" min="0" step="100" inputmode="numeric" /><b>股</b></div>
            </label>
          </div>
        </div>

        <div class="trade-divider"><span>→</span></div>

        <div class="trade-section sell-section">
          <div class="trade-label"><span></span>卖出</div>
          <div class="field-grid">
            <label>
              <span>卖出价格</span>
              <div class="input-wrap"><b>¥</b><input v-model.number="trade.sellPrice" type="number" min="0" step="0.01" inputmode="decimal" /></div>
            </label>
            <label>
              <span>卖出数量</span>
              <div class="input-wrap"><input v-model.number="trade.sellQuantity" type="number" min="0" step="100" inputmode="numeric" /><b>股</b></div>
              <button class="inline-action" type="button" @click="syncQuantity">与买入数量相同</button>
            </label>
          </div>
        </div>

        <div v-if="hasUnmatchedQuantity" class="notice" role="status">
          当前按 {{ result.matchedQuantity }} 股计算；
          <template v-if="result.unmatchedBuyQuantity">多买的 {{ result.unmatchedBuyQuantity }} 股未计入。</template>
          <template v-else>多卖的 {{ result.unmatchedSellQuantity }} 股未计入。</template>
        </div>

        <div class="fee-block">
          <button class="fee-toggle" type="button" :aria-expanded="showFees" @click="showFees = !showFees">
            <span><b>手续费设置</b><small>佣金、印花税与过户费</small></span>
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
            <div class="fee-note">
              <span>默认值仅作常用示例，请以你的券商交割单为准。</span>
              <button type="button" @click="resetFees">恢复默认</button>
            </div>
          </div>
        </div>
      </div>

      <aside class="panel result-panel" aria-live="polite">
        <div class="panel-heading result-heading">
          <div>
            <p class="section-index">02</p>
            <h2>计算结果</h2>
          </div>
          <span class="live-tag"><i></i>实时计算</span>
        </div>

        <div class="profit-card" :class="{ loss: result.netProfit < 0 }">
          <span>预计净收益</span>
          <strong>{{ hasValues ? formatMoney(result.netProfit) : '—' }}</strong>
          <div class="profit-meta">
            <span>净收益率 <b>{{ hasValues ? formatPercent(result.netReturnRate) : '—' }}</b></span>
            <span>价格涨幅 <b>{{ hasValues ? formatPercent(result.priceChangeRate) : '—' }}</b></span>
          </div>
        </div>

        <dl class="result-list">
          <div><dt>毛差价</dt><dd>{{ hasValues ? formatMoney(result.grossProfit) : '—' }}</dd></div>
          <div><dt>每股净收益</dt><dd>{{ hasValues ? formatMoney(result.profitPerShare) : '—' }}</dd></div>
          <div><dt>保本卖出价</dt><dd>{{ hasValues ? formatMoney(result.breakEvenSellPrice) : '—' }}</dd></div>
        </dl>

        <div class="cost-breakdown">
          <div class="breakdown-title"><span>费用明细</span><b>{{ hasValues ? formatMoney(result.totalFees) : '—' }}</b></div>
          <div><span>买入费用</span><b>{{ hasValues ? formatMoney(result.buyFees) : '—' }}</b></div>
          <div><span>卖出费用</span><b>{{ hasValues ? formatMoney(result.sellFees) : '—' }}</b></div>
          <div><span>匹配数量</span><b>{{ hasValues ? `${result.matchedQuantity} 股` : '—' }}</b></div>
        </div>

        <p class="privacy-note"><span>✓</span> 页面不会保存或上传你的输入数据</p>
      </aside>
    </section>

    <footer>计算结果仅供参考，不构成任何投资建议。</footer>
  </main>
</template>
