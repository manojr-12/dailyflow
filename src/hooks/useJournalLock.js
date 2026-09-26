import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'dailyflow-journal-lock'
const PIN_ITERATIONS = 210000

function randomBytes(length) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function bytesToBase64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function readLockConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function lockErrorMessage(error) {
  if (error?.name === 'NotAllowedError') {
    return 'Verification was cancelled or timed out. Try again when you are ready.'
  }
  if (error?.name === 'SecurityError') {
    return 'Device verification is unavailable in this browser. Try a PIN instead.'
  }
  return 'The journal could not be unlocked. Please try again.'
}

async function derivePinVerifier(pin, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PIN_ITERATIONS,
    },
    keyMaterial,
    256
  )
  return new Uint8Array(bits)
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

export function useJournalLock() {
  const [config, setConfig] = useState(readLockConfig)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [deviceLockAvailable, setDeviceLockAvailable] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const checkDeviceLock = async () => {
      const supported =
        window.isSecureContext &&
        'PublicKeyCredential' in window &&
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'

      if (!supported) {
        if (active) setDeviceLockAvailable(false)
        return
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        if (active) setDeviceLockAvailable(available)
      } catch {
        if (active) setDeviceLockAvailable(false)
      }
    }

    checkDeviceLock()
    return () => {
      active = false
    }
  }, [])

  const saveConfig = useCallback((nextConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig))
    setConfig(nextConfig)
  }, [])

  const setupDeviceLock = useCallback(async () => {
    setIsBusy(true)
    setError('')

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'DailyFlow' },
          user: {
            id: randomBytes(16),
            name: 'dailyflow-journal',
            displayName: 'DailyFlow Journal',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      })

      if (!credential) throw new Error('No credential returned')

      saveConfig({
        mode: 'device',
        credentialId: bytesToBase64Url(new Uint8Array(credential.rawId)),
      })
      setIsUnlocked(true)
      return true
    } catch (setupError) {
      setError(lockErrorMessage(setupError))
      return false
    } finally {
      setIsBusy(false)
    }
  }, [saveConfig])

  const setupPin = useCallback(async (pin) => {
    if (!/^\d{6}$/.test(pin)) {
      setError('Choose a 6-digit PIN.')
      return false
    }

    setIsBusy(true)
    setError('')

    try {
      const salt = randomBytes(16)
      const verifier = await derivePinVerifier(pin, salt)
      saveConfig({
        mode: 'pin',
        salt: bytesToBase64Url(salt),
        verifier: bytesToBase64Url(verifier),
      })
      setIsUnlocked(true)
      return true
    } catch {
      setError('The PIN could not be saved. Please try again.')
      return false
    } finally {
      setIsBusy(false)
    }
  }, [saveConfig])

  const unlockWithDevice = useCallback(async () => {
    if (config?.mode !== 'device') return false

    setIsBusy(true)
    setError('')

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials: [
            {
              type: 'public-key',
              id: base64UrlToBytes(config.credentialId),
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      })

      if (!assertion) throw new Error('No assertion returned')
      setIsUnlocked(true)
      return true
    } catch (unlockError) {
      setError(lockErrorMessage(unlockError))
      return false
    } finally {
      setIsBusy(false)
    }
  }, [config])

  const unlockWithPin = useCallback(async (pin) => {
    if (config?.mode !== 'pin') return false

    setIsBusy(true)
    setError('')

    try {
      const verifier = await derivePinVerifier(pin, base64UrlToBytes(config.salt))
      if (!equalBytes(verifier, base64UrlToBytes(config.verifier))) {
        setError('That PIN is not correct.')
        return false
      }
      setIsUnlocked(true)
      return true
    } catch {
      setError('The journal could not be unlocked. Please try again.')
      return false
    } finally {
      setIsBusy(false)
    }
  }, [config])

  const lock = useCallback(() => {
    setIsUnlocked(false)
    setError('')
  }, [])

  return useMemo(
    () => ({
      isConfigured: Boolean(config),
      mode: config?.mode || null,
      isUnlocked,
      deviceLockAvailable,
      isBusy,
      error,
      clearError: () => setError(''),
      setupDeviceLock,
      setupPin,
      unlockWithDevice,
      unlockWithPin,
      lock,
    }),
    [
      config,
      deviceLockAvailable,
      error,
      isBusy,
      isUnlocked,
      lock,
      setupDeviceLock,
      setupPin,
      unlockWithDevice,
      unlockWithPin,
    ]
  )
}
