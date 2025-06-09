<template>
  <div style="text-align: center; margin-top: 36px;">
    <h1>Flashcards App</h1>
    <!-- Topic selection & Flashcards with transition -->
    <transition name="fade-slide" mode="out-in">
      <div v-if="!selectedTopic" key="topic-list">
        <h2>Select Topic</h2>
        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
          <div
            v-for="(cards, topic) in groupedByTopic"
            :key="topic"
            class="topic-card"
            @click="selectTopic(topic)"
          >
            <div style="font-size: 1.25rem; font-weight: bold;">{{ topic }}</div>
            <div style="margin-top: 8px;">{{ cards.length }} cards</div>
          </div>
        </div>
      </div>
      <div v-else key="topic-cards">
        <button @click="selectedTopic = null" style="float: left; margin: 12px;">← Back to Topics</button>
        <h2>{{ selectedTopic }} <small>({{ topicCards.length }} cards)</small></h2>
        <transition-group name="fade-card" tag="div" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
          <Flashcard
            v-for="card in currentCards"
            :key="card.id"
            :card="card"
          />
        </transition-group>
        <div style="margin: 32px;">
          <button @click="prevPage" :disabled="page === 0">Previous</button>
          <button @click="nextPage" :disabled="endIndex >= topicCards.length">Next</button>
        </div>
        <div>
          <small>Page {{ page+1 }} / {{ totalPages }} ({{ topicCards.length }} cards)</small>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Flashcard from './components/flashcard.vue'

const cards = ref([])
const selectedTopic = ref(null)
const page = ref(0)
const pageSize = 3

const fetchCards = async () => {
  const res = await fetch('/cards.json')
  cards.value = await res.json()
}
onMounted(fetchCards)

// Group cards by topic
const groupedByTopic = computed(() => {
  const groups = {}
  for (const c of cards.value) {
    if (!groups[c.topic]) groups[c.topic] = []
    groups[c.topic].push(c)
  }
  return groups
})
const topicCards = computed(() => {
  if (!selectedTopic.value) return []
  return groupedByTopic.value[selectedTopic.value] || []
})
const totalPages = computed(() => Math.ceil(topicCards.value.length / pageSize))
const startIndex = computed(() => page.value * pageSize)
const endIndex = computed(() => startIndex.value + pageSize)
const currentCards = computed(() => topicCards.value.slice(startIndex.value, endIndex.value))

function selectTopic(topic) {
  selectedTopic.value = topic
  page.value = 0
}
function nextPage() {
  if (endIndex.value < topicCards.value.length) page.value++
}
function prevPage() {
  if (page.value > 0) page.value--
}
</script>

<style scoped>
.topic-card {
  background: #ede7ff;
  padding: 32px 40px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(60,30,90,.08);
  cursor: pointer;
  min-width: 120px;
  min-height: 80px;
  transition: background .2s, box-shadow .2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.topic-card:hover {
  background: #e3dbfa;
  box-shadow: 0 6px 18px rgba(60,30,90,.16);
}
/* Fade-slide animation for topic/card transition */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.35s cubic-bezier(.77,0,.175,1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
.fade-card-enter-active, .fade-card-leave-active {
  transition: all 0.45s cubic-bezier(.42,0,.58,1);
}
.fade-card-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.96);
}
.fade-card-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(0.96);
}
</style>