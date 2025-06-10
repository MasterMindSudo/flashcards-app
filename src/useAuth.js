// src/useAuth.js
import { auth } from './firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

export async function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}
export async function logout() {
  return signOut(auth)
}
export function onUserChange(cb) {
  return onAuthStateChanged(auth, cb)
}