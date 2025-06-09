<template>
  <div style="text-align: center; margin-top: 36px;">
    <h1>Flashcards App</h1>
    <!-- Need Revisit Section Button -->
    <div style="margin-bottom: 22px;">
      <button
        class="need-revisit-btn"
        :class="{ active: needRevisitMode }"
        @click="toggleNeedRevisitMode"
        title="Review only cards marked as Need Revisit"
      >🔔 Need Revisit</button>
      <span v-if="needRevisitCount > 0" class="need-revisit-badge">{{ needRevisitCount }}</span>
    </div>
    <!-- Folder selection, Topic selection & Flashcards with transition -->
    <transition name="fade-slide" mode="out-in">
      <!-- Need Revisit Mode UI -->
      <div v-if="needRevisitMode" key="need-revisit-root">
        <div v-if="!nrSelectedFolder">
          <h2>Need Revisit: Select Folder</h2>
          <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
            <div
              v-for="folder in nrFolders"
              :key="folder"
              class="topic-card"
              @click="selectNrFolder(folder)"
            >
              <div style="font-size: 1.25rem; font-weight: bold;">{{ folder }}</div>
              <div style="margin-top: 8px;">{{ nrFolderCount(folder) }} cards</div>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <button @click="toggleNeedRevisitMode">← Back to All Cards</button>
          </div>
        </div>
        <div v-else-if="!nrSelectedTopic">
          <button @click="nrSelectedFolder = null" style="float: left; margin: 12px;">← Back to Folders</button>
          <h2>Need Revisit: Select Topic in "{{ nrSelectedFolder }}"</h2>
          <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
            <div
              v-for="(cards, topic) in nrGroupedByTopicInFolder"
              :key="topic"
              class="topic-card"
              @click="selectNrTopic(topic)"
            >
              <div style="font-size: 1.25rem; font-weight: bold;">{{ topic }}</div>
              <div style="margin-top: 8px;">
                {{ cards.length }} cards |
                <span style="color: #41d25a;">✅ {{ countStatus(cards, 'completed') }}</span> |
                <span style="color: #ffb7c5;">🩷 {{ countStatus(cards, 'non_completed') }}</span> |
                <span style="color: #ffc13b;">🟡 {{ countStatus(cards, 'need_revisit') }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <button @click="nrSelectedTopic = null" style="float: left; margin: 12px;">← Back to Topics</button>
          <h2>Need Revisit: {{ nrSelectedTopic }} <small>({{ nrTopicCards.length }} cards)</small></h2>
          <transition-group name="fade-card" tag="div" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
            <Flashcard
              v-for="card in nrCurrentCards"
              :key="card.id"
              :card="card"
            />
          </transition-group>
          <div style="margin: 32px;">
            <button @click="nrPrevPage" :disabled="nrPage === 0">Previous</button>
            <button @click="nrNextPage" :disabled="nrEndIndex >= nrTopicCards.length">Next</button>
          </div>
          <div>
            <small>Page {{ nrPage+1 }} / {{ nrTotalPages }} ({{ nrTopicCards.length }} cards)</small>
          </div>
        </div>
      </div>
      <!-- Normal Mode UI -->
      <div v-else-if="!selectedFolder" key="folder-list">
        <h2>Select Folder</h2>
        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
          <div
            v-for="folder in uniqueFolders"
            :key="folder"
            class="topic-card"
            @click="selectFolder(folder)"
          >
            <div style="font-size: 1.25rem; font-weight: bold;">{{ folder }}</div>
            <div style="margin-top: 8px;">{{ folderCount(folder) }} cards</div>
          </div>
        </div>
      </div>
      <div v-else-if="!selectedTopic" key="topic-list">
        <button @click="selectedFolder = null" style="float: left; margin: 12px;">← Back to Folders</button>
        <h2>Select Topic in "{{ selectedFolder }}"</h2>
        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;">
          <div
            v-for="(cards, topic) in groupedByTopicInFolder"
            :key="topic"
            class="topic-card"
            @click="selectTopic(topic)"
          >
            <div style="font-size: 1.25rem; font-weight: bold;">{{ topic }}</div>
            <div style="margin-top: 8px;">
              {{ cards.length }} cards |
              <span style="color: #41d25a;">✅ {{ countStatus(cards, 'completed') }}</span> |
              <span style="color: #ffb7c5;">🩷 {{ countStatus(cards, 'non_completed') }}</span> |
              <span style="color: #ffc13b;">🟡 {{ countStatus(cards, 'need_revisit') }}</span>
            </div>
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
const selectedFolder = ref(null)
const selectedTopic = ref(null)
const page = ref(0)
const pageSize = 10

// Need Revisit mode state
const needRevisitMode = ref(false)
const nrSelectedFolder = ref(null)
const nrSelectedTopic = ref(null)
const nrPage = ref(0)

const fetchCards = async () => {
  const res = await fetch('/cards.json')
  cards.value = await res.json()
}
onMounted(fetchCards)

// --- Normal mode logic ---
const uniqueFolders = computed(() => {
  const foldersSet = new Set()
  for (const c of cards.value) {
    if (c.folder) foldersSet.add(c.folder)
  }
  return Array.from(foldersSet)
})

function folderCount(folder) {
  return cards.value.filter(c => c.folder === folder).length
}

const groupedByTopicInFolder = computed(() => {
  if (!selectedFolder.value) return {}
  const groups = {}
  for (const c of cards.value) {
    if (c.folder === selectedFolder.value) {
      if (!groups[c.topic]) groups[c.topic] = []
      groups[c.topic].push(c)
    }
  }
  return groups
})

const topicCards = computed(() => {
  if (!selectedFolder.value || !selectedTopic.value) return []
  return groupedByTopicInFolder.value[selectedTopic.value] || []
})

const totalPages = computed(() => Math.ceil(topicCards.value.length / pageSize))
const startIndex = computed(() => page.value * pageSize)
const endIndex = computed(() => startIndex.value + pageSize)
const currentCards = computed(() => topicCards.value.slice(startIndex.value, endIndex.value))

function selectFolder(folder) {
  selectedFolder.value = folder
  selectedTopic.value = null
  page.value = 0
}
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

// --- Card status helpers for Need Revisit mode ---
function cardStatusKey(id) {
  return `cardStatus-${id}`
}
function getCardStatus(id) {
  return localStorage.getItem(cardStatusKey(id)) || 'non_completed'
}
function isNeedRevisit(card) {
  return getCardStatus(card.id) === 'need_revisit'
}

// --- Need Revisit Mode logic ---
// To ensure instant update, use a reactive trigger that increments whenever a status changes
import { watchEffect, nextTick } from 'vue'
const nrStatusVersion = ref(0)

// Listen for storage changes (from other tabs) and force recompute
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('cardStatus-')) {
    nrStatusVersion.value++
  }
})

// Expose a method for child (Flashcard) to call after status changes
function notifyStatusChanged() {
  nrStatusVersion.value++
}

// Provide to Flashcard via provide/inject (for cross-component communication)
import { provide } from 'vue'
provide('notifyStatusChanged', notifyStatusChanged)

const needRevisitCards = computed(() => {
  // Use nrStatusVersion so this recomputes on status change
  nrStatusVersion.value
  return cards.value.filter(card => isNeedRevisit(card))
})
const needRevisitCount = computed(() => {
  nrStatusVersion.value
  return needRevisitCards.value.length
})

const nrFolders = computed(() => {
  nrStatusVersion.value
  const set = new Set()
  for (const c of needRevisitCards.value) {
    if (c.folder) set.add(c.folder)
  }
  return Array.from(set)
})
function nrFolderCount(folder) {
  nrStatusVersion.value
  return needRevisitCards.value.filter(c => c.folder === folder).length
}
const nrGroupedByTopicInFolder = computed(() => {
  nrStatusVersion.value
  if (!nrSelectedFolder.value) return {}
  const groups = {}
  for (const c of needRevisitCards.value) {
    if (c.folder === nrSelectedFolder.value) {
      if (!groups[c.topic]) groups[c.topic] = []
      groups[c.topic].push(c)
    }
  }
  return groups
})
const nrTopicCards = computed(() => {
  nrStatusVersion.value
  if (!nrSelectedFolder.value || !nrSelectedTopic.value) return []
  return nrGroupedByTopicInFolder.value[nrSelectedTopic.value] || []
})
const nrTotalPages = computed(() => Math.ceil(nrTopicCards.value.length / pageSize))
const nrStartIndex = computed(() => nrPage.value * pageSize)
const nrEndIndex = computed(() => nrStartIndex.value + pageSize)
const nrCurrentCards = computed(() => nrTopicCards.value.slice(nrStartIndex.value, nrEndIndex.value))

function selectNrFolder(folder) {
  nrSelectedFolder.value = folder
  nrSelectedTopic.value = null
  nrPage.value = 0
}
function selectNrTopic(topic) {
  nrSelectedTopic.value = topic
  nrPage.value = 0
}
function nrNextPage() {
  if (nrEndIndex.value < nrTopicCards.value.length) nrPage.value++
}
function nrPrevPage() {
  if (nrPage.value > 0) nrPage.value--
}

function toggleNeedRevisitMode() {
  needRevisitMode.value = !needRevisitMode.value
  // Reset navigation state for Need Revisit view
  nrSelectedFolder.value = null
  nrSelectedTopic.value = null
  nrPage.value = 0
  // Force recompute in case status changed while out of view
  nrStatusVersion.value++
}
// --- Card status count helper ---
function countStatus(cardsArr, status) {
  nrStatusVersion.value
  return cardsArr.filter(card => {
    const s = localStorage.getItem(`cardStatus-${card.id}`) || 'non_completed'
    return s === status
  }).length
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
/* Need Revisit section styles */
.need-revisit-btn {
  font-size: 1.08rem;
  background: #fff8e1;
  color: #a1740a;
  border: 2px solid #ffe082;
  border-radius: 12px;
  padding: 8px 22px 8px 12px;
  margin-right: 9px;
  cursor: pointer;
  font-weight: 600;
  transition: background .18s, color .18s, border .18s;
  outline: none;
  box-shadow: 0 1px 4px rgba(255,200,60,.07);
  position: relative;
}
.need-revisit-btn.active,
.need-revisit-btn:focus {
  background: #ffe082;
  color: #6c47ff;
  border-color: #6c47ff;
}
.need-revisit-btn:hover:not(.active) {
  background: #fff3c2;
}
.need-revisit-badge {
  display: inline-block;
  min-width: 1.5em;
  padding: 0 7px;
  font-size: 1rem;
  background: #ffb347;
  color: #fff;
  border-radius: 10px;
  margin-left: 3px;
  font-weight: 600;
  vertical-align: middle;
  position: relative;
  top: -2px;
}
/* Fade-slide animation for folder/topic/card transition */
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