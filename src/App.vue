<template>
  <div v-if="!user" class="login-panel">
    <h2>Login to Flashcards</h2>
    <input v-model="email" placeholder="Email" style="padding:8px; margin:8px 0; font-size:1rem;"/>
    <input v-model="password" type="password" placeholder="Password" style="padding:8px; margin:8px 0; font-size:1rem;"/>
    <div>
      <button @click="doLogin" style="padding:6px 14px; font-size:1rem; margin-right:12px;">Login</button>
      <button @click="doRegister" style="padding:6px 14px; font-size:1rem;">Register</button>
    </div>
  </div>
  <div v-else>
    <div class="top-controls">
      <div class="upload-container">
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="onFileChange"
          :key="fileInputKey"
          style="display: none"
          :disabled="isUploading"
        />
        <button @click="triggerFileInput" :disabled="isUploading" class="import-btn">
          <svg v-if="!isUploading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span v-if="isUploading" class="upload-spinner"></span>
          <span>{{ isUploading ? 'Importing...' : 'Import' }}</span>
        </button>
        <div v-if="uploadStatus" class="upload-status" :class="uploadStatus.type">
          {{ uploadStatus.message }}
        </div>
      </div>
      <button @click="doLogout" class="logout-btn">Logout</button>
    </div>
    <div style="text-align: center; margin-top: 36px; position: relative;">
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
      <transition :name="transitionDirection === 'forward' ? 'slide-right' : 'slide-left'" mode="out-in">
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
              <button class="back-arrow-btn" @click="transitionDirection = 'backward'; toggleNeedRevisitMode()" aria-label="Back">
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="display:block">
                  <path d="M19 4L9 14L19 24" stroke="#555" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-else-if="!nrSelectedTopic">
            <button class="back-arrow-btn" @click="transitionDirection = 'backward'; nrSelectedFolder = null" aria-label="Back">
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="display:block">
                <path d="M19 4L9 14L19 24" stroke="#555" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
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
            <button class="back-arrow-btn" @click="transitionDirection = 'backward'; nrSelectedTopic = null" aria-label="Back">
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="display:block">
                <path d="M19 4L9 14L19 24" stroke="#555" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
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
          <button class="back-arrow-btn" @click="transitionDirection = 'backward'; selectedFolder = null" aria-label="Back">
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="display:block">
              <path d="M19 4L9 14L19 24" stroke="#555" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
          <button class="back-arrow-btn" @click="transitionDirection = 'backward'; selectedTopic = null" aria-label="Back">
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" style="display:block">
              <path d="M19 4L9 14L19 24" stroke="#555" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { login, register, logout, onUserChange } from './useAuth'
import { loadUserCards, saveUserCards } from './useCards'
import Flashcard from './components/flashcard.vue'

const user = ref(null)
const email = ref('')
const password = ref('')

onUserChange(async u => {
  user.value = u
  if (u) {
    cards.value = await loadUserCards()
  } else {
    cards.value = []
  }
})

async function doLogin() {
  await login(email.value, password.value)
}
async function doRegister() {
  await register(email.value, password.value)
}
async function doLogout() {
  await logout()
}

const cards = ref([])
const selectedFile = ref(null)

function onFileChange(e) {
  const file = e.target.files[0] || null
  if (file) {
    selectedFile.value = file
    handleUpload()
  } else {
    selectedFile.value = null
  }
}

const fileInput = ref(null)
const fileInputKey = ref(Date.now())
const selectedFolder = ref(null)
const selectedTopic = ref(null)
const page = ref(0)
const pageSize = 10
const transitionDirection = ref('forward') // 'forward' | 'backward'

// Need Revisit mode state
const needRevisitMode = ref(false)
const nrSelectedFolder = ref(null)
const nrSelectedTopic = ref(null)
const nrPage = ref(0)

// fetchCards and onMounted removed

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
  transitionDirection.value = 'forward';
  selectedFolder.value = folder
  selectedTopic.value = null
  page.value = 0
}
function selectTopic(topic) {
  transitionDirection.value = 'forward';
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
  transitionDirection.value = 'forward';
  nrSelectedFolder.value = folder
  nrSelectedTopic.value = null
  nrPage.value = 0
}
function selectNrTopic(topic) {
  transitionDirection.value = 'forward';
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
  if (!needRevisitMode.value) {
    transitionDirection.value = 'forward';
  } else {
    transitionDirection.value = 'backward';
  }
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

function simpleHash(card) {
  const str = [card.question, card.answer, card.folder, card.topic].join('|')
  let hash = 0, i, chr
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return 'card_' + Math.abs(hash)
}

// Upload state
const isUploading = ref(false)
const uploadStatus = ref(null)

function triggerFileInput() {
  uploadStatus.value = null;
  fileInput.value?.click()
}

async function handleUpload() {
  if (!selectedFile.value) {
    setUploadStatus('error', 'Please choose a JSON file first.')
    return
  }

  if (!(selectedFile.value instanceof File)) {
    setUploadStatus('error', 'Invalid file selection.')
    return
  }

  if (!selectedFile.value.name.toLowerCase().endsWith('.json')) {
    setUploadStatus('error', 'Please select a JSON file.')
    return
  }

  isUploading.value = true
  setUploadStatus('info', 'Starting upload...')

  try {
    const text = await selectedFile.value.text()
    let importedCards;
    try {
      importedCards = JSON.parse(text)
      setUploadStatus('info', 'Validating file...')
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message)
    }

    if (!Array.isArray(importedCards)) {
      throw new Error('File must contain a JSON array of cards')
    }

    const requiredFields = ['question', 'answer', 'folder', 'topic']
    const invalidCards = importedCards.filter(card => 
      !card || typeof card !== 'object' || 
      requiredFields.some(field => !card[field] || typeof card[field] !== 'string')
    )
    if (invalidCards.length > 0) {
      throw new Error(`Found ${invalidCards.length} invalid cards. Each card must have: ${requiredFields.join(', ')}`)
    }

    setUploadStatus('info', 'Checking for new cards...');

    // Assign a hash ID to all imported cards.
    importedCards.forEach(card => card.id = simpleHash(card));
    // Also ensure existing cards have IDs.
    cards.value.forEach(card => {
        if (!card.id) card.id = simpleHash(card);
    });

    const existingCardIds = new Set(cards.value.map(card => card.id));
    const newCards = importedCards.filter(card => !existingCardIds.has(card.id));
    const duplicateCount = importedCards.length - newCards.length;

    if (newCards.length === 0) {
      let message = 'No new cards to add.';
      if (duplicateCount > 0) {
        message += ` All ${duplicateCount} cards in the file are duplicates.`
      }
      setUploadStatus('success', message);
      resetFileInput();
      return; 
    }

    const updatedCards = [...cards.value, ...newCards];

    try {
      setUploadStatus('info', `Saving ${newCards.length} new card(s)...`);
      await saveUserCards(updatedCards);
      cards.value = updatedCards;

      let message = `Successfully added ${newCards.length} new card(s).`;
      if (duplicateCount > 0) {
        message += ` Skipped ${duplicateCount} duplicate(s).`;
      }
      setUploadStatus('success', message);
      resetFileInput();
    } catch (error) {
      throw new Error('Failed to save new cards to the database: ' + error.message);
    }
  } catch (err) {
    console.error('Upload error:', err)
    setUploadStatus('error', err.message || 'Error processing file')
  } finally {
    isUploading.value = false
  }
}

function setUploadStatus(type, message) {
  uploadStatus.value = { type, message }
  // Clear success message after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      if (uploadStatus.value?.type === 'success') {
        uploadStatus.value = null
      }
    }, 5000)
  }
}

function resetFileInput() {
  selectedFile.value = null
  fileInputKey.value = Date.now()
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
/* Slide left/right animation for folder/topic/card transition */
.slide-right-enter-active, .slide-right-leave-active,
.slide-left-enter-active, .slide-left-leave-active {
  transition: all 0.45s cubic-bezier(.42,0,.58,1);
}
.slide-right-enter-from, .slide-left-leave-to {
  opacity: 0;
  transform: translateX(80vw);
}
.slide-right-leave-to, .slide-left-enter-from {
  opacity: 0;
  transform: translateX(-80vw);
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

/* Modern floating back arrow button styles with SVG arrow */
.back-arrow-btn {
  position: fixed;
  left: 14px;
  top: 12px;
  z-index: 99999;
  background: none;
  border: none;
  padding: 0;
  width: 38px;
  height: 38px;
  cursor: pointer;
  outline: none;
}
.back-arrow-btn svg path {
  stroke: #555;
  transition: stroke .17s;
}
.back-arrow-btn:focus svg path,
.back-arrow-btn:active svg path,
.back-arrow-btn:hover svg path {
  stroke: #6c47ff;
}

/* Login panel styles */
.login-panel {
  max-width: 400px;
  margin: 80px auto 40px auto;
  padding: 28px 18px 20px 18px;
  border-radius: 14px;
  background: #f8f7fc;
  box-shadow: 0 1px 12px rgba(40,30,70,.10);
  text-align: center;
}
.login-panel input {
  width: 85%;
  margin-bottom: 10px;
  border: 1px solid #a1a1d7;
  border-radius: 7px;
  font-size: 1rem;
  background: #fff;
}
.login-panel button {
  margin: 9px 8px;
  font-size: 1.04rem;
  border-radius: 8px;
  border: none;
  background: #6c47ff;
  color: #fff;
  padding: 7px 19px;
  cursor: pointer;
  font-weight: 600;
  transition: background .17s;
}
.login-panel button:hover {
  background: #5136c2;
}
@media (max-width: 500px) {
  h1 {
    font-size: 1.6rem !important;
    max-width: 95vw;
    text-align: center !important;
    margin-bottom: 13px !important;
    margin-top: 6vw !important;
  }
  h2 {
    font-size: 1.04rem !important;
    max-width: 97vw;
    text-align: center !important;
    margin-bottom: 13px !important;
    margin-top: 7vw !important;
    line-height: 1.23;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    white-space: normal !important;
  }
  .need-revisit-btn {
    padding: 5px 11px 5px 8px !important;
    font-size: 0.97rem !important;
    border-radius: 7px !important;
    margin-right: 4px !important;
  }
  .need-revisit-badge {
    padding: 0 5px !important;
    font-size: 0.92rem !important;
    border-radius: 7px !important;
    min-width: 1.2em !important;
    top: -1px !important;
  }
  .topic-card {
    width: 96vw !important;
    max-width: 390px !important;
    min-width: 0 !important;
    margin: 13px auto !important;
    padding: 22px 8px !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 5px rgba(60,30,90,.08) !important;
    font-size: 1.01rem !important;
  }
  .topic-card .stat-bar,
  .topic-card span,
  .topic-card div {
    flex-wrap: wrap !important;
    font-size: 1.1rem !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
  }
  .topic-card > div {
    margin-top: 5px !important;
    margin-bottom: 2px !important;
  }
  .fade-card-enter-from,
  .fade-card-leave-to,
  .fade-slide-enter-from,
  .fade-slide-leave-to {
    transform: none !important;
  }
  /* Reduce vertical spacing on sections, headings, card containers, and buttons */
  [style*="margin-top: 36px"] {
    margin-top: 5vw !important;
  }
  [style*="margin-bottom: 22px"] {
    margin-bottom: 10px !important;
  }
  [style*="margin-top: 20px"] {
    margin-top: 12px !important;
  }
  [style*="margin: 32px;"] {
    margin: 18px !important;
  }
  [style*="margin: 12px;"] {
    margin: 6px !important;
  }
  /* Container padding */
  body, #app, .container, .main, .App, .app-main, .app-container, div[style*="text-align: center"] {
    padding-left: 4vw !important;
    padding-right: 4vw !important;
    box-sizing: border-box !important;
  }
  /* Button rows wrap and gap */
  div[style*="display: flex"][style*="gap: 28px"], .card-status-controls {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
}
.top-controls {
  position: fixed;
  top: 12px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 20000;
}

.upload-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.import-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8f7fc;
  border: 1px solid #d1d1ef;
  color: #333;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  min-width: 110px;
  justify-content: center;
}

.import-btn:hover:not(:disabled) {
  background: #ede7ff;
  border-color: #6c47ff;
  color: #6c47ff;
}

.import-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.import-btn .upload-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #6c47ff;
  border-top-color: transparent;
}

.logout-btn {
  padding: 8px 18px;
  font-size: 0.95rem;
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #a1740a;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.logout-btn:hover {
  background: #ffe082;
  border-color: #ffc107;
}

.upload-status {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 280px;
  z-index: 10;
}

/* Modern floating back arrow button styles with SVG arrow */
.back-arrow-btn {
  position: fixed;
  left: 14px;
  top: 12px;
  z-index: 99999;
  background: none;
  border: none;
  padding: 0;
  width: 38px;
  height: 38px;
  cursor: pointer;
  outline: none;
}
.back-arrow-btn svg path {
  stroke: #555;
  transition: stroke .17s;
}
.back-arrow-btn:focus svg path,
.back-arrow-btn:active svg path,
.back-arrow-btn:hover svg path {
  stroke: #6c47ff;
}

.clear-file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>