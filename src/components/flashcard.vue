<template>
  <div class="flashcard-outer" @click="flipCard">
    <div class="flashcard-inner" :class="{ flipped }">
      <div class="flashcard-front">
        {{ card.question }}
      </div>
      <div class="flashcard-back">
        {{ card.answer }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  card: Object
})
const flipped = ref(false)
function flipCard() {
  flipped.value = !flipped.value
}
// Reset flip when card changes
watch(() => props.card, () => flipped.value = false)
</script>

<style scoped>
.flashcard-outer {
  perspective: 800px;
  width: 320px;
  min-height: 170px;
  margin: 20px;
  display: inline-block;
  vertical-align: top;
  cursor: pointer;
}
.flashcard-inner {
  min-height: 170px;
  width: 100%;
  transition: transform 0.45s cubic-bezier(.45,.05,.55,.95);
  transform-style: preserve-3d;
  position: relative;
}
.flashcard-inner.flipped {
  transform: rotateY(180deg);
}
.flashcard-front, .flashcard-back {
  position: absolute;
  width: 100%;
  min-height: 170px;
  padding: 20px 20px 28px 20px;
  box-sizing: border-box;
  border-radius: 16px;
  background: #f5f5fa;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.11);
  backface-visibility: hidden;
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.7;
}
.flashcard-front {
  z-index: 2;
}
.flashcard-back {
  background: #e6e6ff;
  transform: rotateY(180deg);
  z-index: 1;
}
</style>