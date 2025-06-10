// src/useCards.js
import { db, auth } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

/**
 * Load the current user's cards array from Firestore.
 * @returns {Promise<Array>} Array of card objects, or empty array if none.
 * @throws {Error} If there's an error loading cards
 */
export async function loadUserCards() {
  try {
    const user = auth.currentUser
    if (!user) return []
    const ref = doc(db, 'userCards', user.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      return Array.isArray(data.cards) ? data.cards : []
    }
    return []
  } catch (error) {
    console.error('Error loading cards:', error)
    throw new Error('Failed to load cards: ' + error.message)
  }
}

/**
 * Save (or overwrite) the user's cards array to Firestore.
 * @param {Array} cards Array of card objects to persist.
 * @throws {Error} If there's an error saving cards
 */
export async function saveUserCards(cards) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    if (!Array.isArray(cards)) throw new Error('Cards must be an array')
    
    const ref = doc(db, 'userCards', user.uid)
    await setDoc(ref, { cards, lastUpdated: new Date().toISOString() })
  } catch (error) {
    console.error('Error saving cards:', error)
    throw new Error('Failed to save cards: ' + error.message)
  }
}

// Utility function for card status key
export function cardStatusKey(id) {
  return `cardStatus-${id}`
}