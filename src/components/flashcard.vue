<template>
  <div
    class="flashcard-outer"
    :class="statusClass"
    @click="flipCard"
  >
    <div class="flashcard-main-content">
      <div class="flashcard-inner" :class="{ flipped }">
        <div class="flashcard-front">
          <div class="flashcard-content">
            {{ card.question }}
          </div>
        </div>
        <div class="flashcard-back">
          <div class="flashcard-content">
            {{ card.answer }}
          </div>
        </div>
      </div>
    </div>
    <div
      class="card-status-controls card-status-controls-below"
      @click.stop
    >
      <button
        :class="['status-btn', 'completed', status === 'completed' ? 'active' : '']"
        @click.stop.prevent="setStatus('completed')"
        title="Mark as Completed"
      >Completed</button>
      <button
        :class="['status-btn', 'need-revisit', status === 'need_revisit' ? 'active' : '']"
        @click.stop.prevent="setStatus('need_revisit')"
        title="Mark as Need Revisit"
      >Need Revisit</button>
      <button
        :class="['status-btn', 'non-completed', status === 'non_completed' ? 'active' : '']"
        @click.stop.prevent="setStatus('non_completed')"
        title="Mark as Non-completed"
      >Non-completed</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { inject } from 'vue'
const props = defineProps({
  card: Object
})
const flipped = ref(false)
const status = ref('non_completed')
// For Need Revisit view refresh
const notifyStatusChanged = inject('notifyStatusChanged', null)

// Utility: localStorage key
function cardStatusKey(id) {
  return `cardStatus-${id}`
}

// Initialize status from localStorage
function loadStatus() {
  if (!props.card?.id) return
  const s = localStorage.getItem(cardStatusKey(props.card.id))
  status.value = s || 'non_completed'
}

function persistStatus() {
  if (props.card?.id) {
    localStorage.setItem(cardStatusKey(props.card.id), status.value)
  }
}

function setStatus(s) {
  status.value = s
  persistStatus()
  // If notifyStatusChanged is provided (from App.vue), call it to force refresh Need Revisit
  if (typeof notifyStatusChanged === 'function') {
    notifyStatusChanged()
  }
}

function flipCard() {
  flipped.value = !flipped.value
}

// Card border color by status
const statusClass = computed(() => {
  return {
    'completed': status.value === 'completed',
    'need-revisit': status.value === 'need_revisit',
    'non-completed': status.value === 'non_completed'
  }
})

onMounted(() => {
  loadStatus()
})
// Reset flip and reload status when card changes
watch(() => props.card, () => {
  flipped.value = false
  loadStatus()
})

// Also reload status when card is flipped, in case external change (optional)
watch(flipped, () => loadStatus())
</script>

<style scoped>
.flashcard-outer {
  perspective: 800px;
  width: 320px;
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  vertical-align: top;
  cursor: pointer;
  border: 3px solid #d1d1ef;
  border-radius: 18px;
  background: white;
  transition: border-color 0.25s;
  position: relative;
  height: auto;
  min-height: 210px;
  max-height: 390px;
  box-sizing: border-box;
}
.flashcard-main-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.flashcard-inner {
  width: 100%;
  transition: transform 0.45s cubic-bezier(.45,.05,.55,.95);
  transform-style: preserve-3d;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
}
.flashcard-inner.flipped {
  transform: rotateY(180deg);
}
.flashcard-front,
.flashcard-back {
  min-height: 0;
  box-sizing: border-box;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  font-size: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.11);
  backface-visibility: hidden;
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.7;
  height: 100%;
  padding: 0;
  background: #f5f5fa;
  position: relative;
  flex: 1 1 auto;
}
.flashcard-front {
}
.flashcard-back {
  background: #e6e6ff;
  transform: rotateY(180deg);
}
.flashcard-content {
  padding: 20px 20px 18px 20px;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: auto;
  max-height: unset;
  width: 100%;
  box-sizing: border-box;
}
/* Card status border colors */
.flashcard-outer.completed {
  border-color: #6bd36b !important;
  box-shadow: 0 2px 16px rgba(80,200,80,0.10);
}
.flashcard-outer.need-revisit {
  border-color: #ffb347 !important;
  box-shadow: 0 2px 16px rgba(255,183,47,0.11);
}
.flashcard-outer.non-completed {
  border-color: #d1d1ef;
}
/* Status controls */
.card-status-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 0 13px 0;
  padding: 0;
  pointer-events: auto;
  z-index: 3;
  align-items: stretch;
}
.card-status-controls-below {
  margin-top: 0;
  margin-bottom: 13px;
  padding-top: 10px;
  border-top: 1px solid #ece4ff;
  background: #fafaff;
  /* Stick to bottom of card */
  /* No position: absolute so it stays after content, but always visible */
}
.status-btn {
  font-size: 0.97rem;
  padding: 5px 13px;
  border-radius: 10px;
  border: none;
  background: #e6e6ff;
  color: #444;
  cursor: pointer;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(60,30,90,.07);
  transition: background .13s, color .13s;
}
.status-btn.active,
.status-btn:focus {
  background: #6c47ff;
  color: #fff;
  font-weight: bold;
}
.status-btn.completed.active {
  background: #41d25a !important;
  color: #fff !important;
}
.status-btn.need-revisit.active {
  background: #ffc13b !important;
  color: #fff !important;
}
.status-btn.non-completed.active {
  background: #ffb7c5 !important;
  color: #fff !important;
}
.status-btn:hover:not(.active) {
  background: #d6d6f9;
}
</style>
@media (max-width: 500px) {
  .flashcard-outer {
    width: 98vw;
    max-width: 390px;
    min-width: 0;
    margin: 11px auto;
    height: auto;
    min-height: 260px;
    border-radius: 11px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.09);
    padding: 0;
  }
  .flashcard-main-content {
    min-height: 0;
  }
  .flashcard-inner,
  .flashcard-front,
  .flashcard-back {
    border-radius: 9px;
    font-size: 1.08rem;
    box-shadow: 0 1px 5px rgba(0,0,0,0.09);
  }
  .flashcard-content {
    padding: 14px 8px 8px 8px;
    font-size: 1.02rem;
  }
  .card-status-controls {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.98rem;
    margin-bottom: 7px;
    margin-top: 0;
  }
  .card-status-controls-below {
    margin-bottom: 7px;
    padding-top: 7px;
  }
  .status-btn {
    padding: 4px 8px;
    font-size: 0.95rem;
    border-radius: 7px;
    margin-bottom: 4px;
  }
}