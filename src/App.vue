<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import NumberInput from "./components/NumberInput.vue"
import {
  calculatePriceChange,
  calculateTrade,
  type FeeSettings,
  type PriceChangeDirection,
  type TradeInput,
} from "./calculator"

const initialTrade: TradeInput = {
  buyPrice: 100,
  buyQuantity: 100,
  sellPrice: 102,
  sellQuantity: 100,
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
const quickPrice = ref(100)
const quickPercentage = ref(10)
const quickDirection = ref<PriceChangeDirection>("increase")
const showFees = ref(false)
const result = computed(() => calculateTrade(trade, fees))
const quickResult = computed(() =>
  calculatePriceChange(
    quickPrice.value,
    quickPercentage.value,
    quickDirection.value,
  ),
)
const hasQuickValues = computed(
  () => quickPrice.value > 0 && quickPercentage.value >= 0,
)
const hasValues = computed(
  () =>
    trade.buyPrice > 0 &&
    trade.sellPrice > 0 &&
    result.value.matchedQuantity > 0,
)
const hasUnmatchedQuantity = computed(
  () =>
    result.value.unmatchedBuyQuantity > 0 ||
    result.value.unmatchedSellQuantity > 0,
)
const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const formatMoney = (value: number) => money.format(value)
const formatPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(2)}%`

function clearAll() {
  quickPrice.value = 0
  quickPercentage.value = 0
  Object.assign(trade, {
    buyPrice: 0,
    buyQuantity: 0,
    sellPrice: 0,
    sellQuantity: 0,
  })
}

function setQuickPercentage(value: number) {
  quickPercentage.value = value
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

    <section class="panel quick-panel" aria-labelledby="quick-calculator-title">
      <div class="quick-heading">
        <div>
          <span class="eyebrow">PRICE MOVE</span>
          <h1 id="quick-calculator-title">涨跌速算</h1>
        </div>
        <p>输入当前股价和涨跌幅，立即查看目标价格</p>
      </div>

      <div class="quick-layout">
        <div class="quick-inputs">
          <NumberInput
            v-model="quickPrice"
            label="当前股价"
            unit="元"
            :step="0.01"
          />

          <div class="percentage-field">
            <span>涨跌幅</span>
            <div class="percentage-control">
              <div class="direction-switch" aria-label="选择涨跌方向">
                <button
                  type="button"
                  :class="{ active: quickDirection === 'increase' }"
                  :aria-pressed="quickDirection === 'increase'"
                  @click="quickDirection = 'increase'"
                >
                  + 加
                </button>
                <button
                  type="button"
                  :class="{ active: quickDirection === 'decrease' }"
                  :aria-pressed="quickDirection === 'decrease'"
                  @click="quickDirection = 'decrease'"
                >
                  − 减
                </button>
              </div>
              <NumberInput
                v-model="quickPercentage"
                label="百分比"
                unit="%"
                :step="0.1"
              />
            </div>
            <div class="percentage-presets" aria-label="常用百分比">
              <button
                v-for="value in [5, 10, 20, 30]"
                :key="value"
                type="button"
                :class="{ active: quickPercentage === value }"
                @click="setQuickPercentage(value)"
              >
                {{ value }}%
              </button>
            </div>
          </div>
        </div>

        <div
          class="quick-result"
          :class="{ decrease: quickDirection === 'decrease' }"
          aria-live="polite"
        >
          <span>对应价格</span>
          <strong>{{
            hasQuickValues ? formatMoney(quickResult.targetPrice) : "—"
          }}</strong>
          <p v-if="hasQuickValues">
            每股
            <b>{{ quickResult.priceDifference >= 0 ? "赚" : "亏" }}</b>
            {{ formatMoney(Math.abs(quickResult.priceDifference)) }}
          </p>
          <p v-else>请输入当前股价</p>
        </div>
      </div>
    </section>

    <section class="calculator-grid">
      <div class="panel input-panel">
        <div class="trade-head">
          <strong><i class="buy-dot"></i>买入</strong>
          <span>成交金额 {{ formatMoney(result.buyAmount) }}</span>
        </div>
        <div class="field-grid">
          <NumberInput
            v-model="trade.buyPrice"
            label="买入价格"
            unit="元"
            :step="0.01"
          />
          <NumberInput
            v-model="trade.buyQuantity"
            label="买入股数"
            unit="股"
            :step="100"
          />
        </div>

        <div class="trade-actions">
          <button type="button" @click="swapPrices">⇅ 交换价格</button
          ><span></span>
        </div>

        <div class="trade-head">
          <strong><i class="sell-dot"></i>卖出</strong>
          <span>成交金额 {{ formatMoney(result.sellAmount) }}</span>
        </div>
        <div class="field-grid">
          <NumberInput
            v-model="trade.sellPrice"
            label="卖出价格"
            unit="元"
            :step="0.01"
          />
          <NumberInput
            v-model="trade.sellQuantity"
            label="卖出股数"
            unit="股"
            :step="100"
          />
        </div>
        <button class="sync-button" type="button" @click="syncQuantity">
          卖出股数跟随买入
        </button>

        <div v-if="hasUnmatchedQuantity" class="notice" role="status">
          按 {{ result.matchedQuantity }} 股计算；
          <template v-if="result.unmatchedBuyQuantity"
            >多买 {{ result.unmatchedBuyQuantity }} 股未计入</template
          >
          <template v-else
            >多卖 {{ result.unmatchedSellQuantity }} 股未计入</template
          >
        </div>

        <div class="fee-block">
          <button
            class="fee-toggle"
            type="button"
            :aria-expanded="showFees"
            @click="showFees = !showFees"
          >
            <span><b>手续费</b><small>佣金 / 印花税 / 过户费</small></span>
            <span class="chevron" :class="{ open: showFees }">⌄</span>
          </button>
          <div v-if="showFees" class="fee-content">
            <div class="fee-row">
              <label class="switch-line"
                ><input
                  v-model="fees.commissionEnabled"
                  type="checkbox"
                />佣金</label
              >
              <label class="compact-field"
                ><span>费率</span
                ><input
                  v-model.number="fees.commissionRate"
                  type="number"
                  min="0"
                  step="0.001"
                /><b>%</b></label
              >
              <label class="compact-field"
                ><span>最低</span
                ><input
                  v-model.number="fees.minimumCommission"
                  type="number"
                  min="0"
                  step="1"
                /><b>元</b></label
              >
            </div>
            <div class="fee-row">
              <label class="switch-line"
                ><input
                  v-model="fees.stampDutyEnabled"
                  type="checkbox"
                />卖出印花税</label
              >
              <label class="compact-field"
                ><span>费率</span
                ><input
                  v-model.number="fees.stampDutyRate"
                  type="number"
                  min="0"
                  step="0.01"
                /><b>%</b></label
              >
            </div>
            <div class="fee-row">
              <label class="switch-line"
                ><input
                  v-model="fees.transferFeeEnabled"
                  type="checkbox"
                />过户费（双向）</label
              >
              <label class="compact-field"
                ><span>费率</span
                ><input
                  v-model.number="fees.transferFeeRate"
                  type="number"
                  min="0"
                  step="0.001"
                /><b>%</b></label
              >
            </div>
            <div class="fee-note">
              <span>请以券商交割单为准</span
              ><button type="button" @click="resetFees">恢复默认</button>
            </div>
          </div>
        </div>
      </div>

      <aside class="panel result-panel" aria-live="polite">
        <div class="result-top">
          <span>预计净收益</span>
          <strong :class="{ loss: result.netProfit < 0 }">{{
            hasValues ? formatMoney(result.netProfit) : "—"
          }}</strong>
        </div>
        <div class="rate-grid">
          <div>
            <span>净收益率</span
            ><b :class="{ loss: result.netReturnRate < 0 }">{{
              hasValues ? formatPercent(result.netReturnRate) : "—"
            }}</b>
          </div>
          <div>
            <span>价格涨幅</span
            ><b :class="{ loss: result.priceChangeRate < 0 }">{{
              hasValues ? formatPercent(result.priceChangeRate) : "—"
            }}</b>
          </div>
        </div>
        <dl class="result-list">
          <div>
            <dt>毛差价</dt>
            <dd>{{ hasValues ? formatMoney(result.grossProfit) : "—" }}</dd>
          </div>
          <div>
            <dt>每股净收益</dt>
            <dd>{{ hasValues ? formatMoney(result.profitPerShare) : "—" }}</dd>
          </div>
          <div>
            <dt>手续费</dt>
            <dd>{{ hasValues ? formatMoney(result.totalFees) : "—" }}</dd>
          </div>
          <div>
            <dt>保本卖出价</dt>
            <dd>
              {{ hasValues ? formatMoney(result.breakEvenSellPrice) : "—" }}
            </dd>
          </div>
          <div>
            <dt>匹配股数</dt>
            <dd>{{ hasValues ? `${result.matchedQuantity} 股` : "—" }}</dd>
          </div>
        </dl>
        <p class="privacy-note">仅在当前页面计算，不保存数据</p>
      </aside>
    </section>
  </main>
</template>
