// Background: keep session token in chrome.storage and perform API calls on request

const storage = chrome.storage.local

async function setToken(token){ await storage.set({ ws_token: token || null }) }
async function getToken(){ const v = await storage.get('ws_token'); return v.ws_token || null }

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  ;(async () => {
    if (msg?.type === 'SESSION_UPDATED') {
      await setToken(msg.token || null)
      sendResponse({ ok: true })
      return
    }
    if (msg?.type === 'TRANSLATE_AND_SAVE') {
      const token = await getToken()
      if (!token) { sendResponse({ ok:false, error:'not_authenticated' }); return }
      try {
        const { apiBase, word, sourceLang, targetLang } = msg
        const res = await fetch(`${apiBase}/api/translate`, {
          method: 'POST',
          headers: {
            'content-type':'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ word, source_lang: sourceLang || undefined, target_lang: targetLang || undefined })
        })
        const data = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(data?.error?.message || 'Request failed')
        sendResponse({ ok:true, data })
      } catch (e) {
        sendResponse({ ok:false, error: e.message })
      }
      return true
    }
  })()
  return true
})


