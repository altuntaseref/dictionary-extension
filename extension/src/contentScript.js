// Inject small floating button when user selects text; click to translate & save

const API_BASE = 'https://dictionary-backend.business-altuntass.workers.dev'
const BUTTON_OFFSET = { x: 12, y: -36 }

let tooltipEl = null
let toastEl = null
let styleInjected = false
let lastPointer = { x: 0, y: 0 }
let updateTimeout = null
let hideTimeout = null

function ensureStyle(){
  if (styleInjected) return
  const css = `
  .ws-tooltip-btn{position:fixed;z-index:2147483647;background:#6A7B5E;color:#fff;border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 6px 16px rgba(0,0,0,.15);cursor:pointer;border:0;pointer-events:auto}
  .ws-tooltip-btn:hover{filter:brightness(0.95);transform:scale(1.05)}
  .ws-toast{position:fixed;z-index:2147483647;left:50%;transform:translateX(-50%);bottom:24px;background:#fff;color:#3E3B32;border:1px solid #D3D1C7;border-radius:10px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.15);pointer-events:none}
  `
  const s = document.createElement('style')
  s.textContent = css
  document.documentElement.appendChild(s)
  styleInjected = true
}

function createTooltip() {
  ensureStyle()
  if (tooltipEl) return tooltipEl
  tooltipEl = document.createElement('button')
  tooltipEl.className = 'ws-tooltip-btn'
  tooltipEl.title = 'Save to WordSnap'
  tooltipEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="white"/></svg>'
  tooltipEl.style.display = 'none'
  document.body.appendChild(tooltipEl)
  tooltipEl.addEventListener('click', onTranslateClick)
  return tooltipEl
}

function showToast(text) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'ws-toast'
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = text
  toastEl.style.display = 'block'
  clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => { if (toastEl) toastEl.style.display = 'none' }, 2000)
}

function getSelectionTextAndRect(){
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      return { text: '', rect: null }
    }
    
    const text = sel.toString().trim()
    if (!text || text.length < 1) {
      return { text: '', rect: null }
    }
    
    // Check if text has at least one letter or number
    if (!/[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(text)) {
      return { text: '', rect: null }
    }
    
    const range = sel.getRangeAt(0)
    let rect = range.getBoundingClientRect()
    
    // If rect is invalid, try to get client rects
    if ((!rect || rect.width === 0 && rect.height === 0) && range.getClientRects) {
      const rects = range.getClientRects()
      if (rects && rects.length > 0) {
        // Use the last rect (usually the end of selection)
        rect = rects[rects.length - 1]
      }
    }
    
    // If still no valid rect, try to create a new range from selection
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      try {
        const newRange = range.cloneRange()
        newRange.collapse(false) // Collapse to end
        const endNode = newRange.startContainer
        if (endNode.nodeType === Node.TEXT_NODE && endNode.parentElement) {
          const tempRect = endNode.parentElement.getBoundingClientRect()
          if (tempRect && tempRect.width > 0 && tempRect.height > 0) {
            rect = {
              left: tempRect.right,
              top: tempRect.top,
              right: tempRect.right,
              bottom: tempRect.bottom,
              width: 0,
              height: tempRect.height
            }
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return { text, rect }
  } catch (e) {
    return { text: '', rect: null }
  }
}

function positionTooltip(rect, fallbackPoint){
  const btn = createTooltip()
  
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    // Try to use fallback point if available
    if (fallbackPoint && fallbackPoint.x > 0 && fallbackPoint.y > 0) {
      const left = fallbackPoint.x + BUTTON_OFFSET.x
      const top = fallbackPoint.y + BUTTON_OFFSET.y
      btn.style.left = `${Math.max(0, left)}px`
      btn.style.top = `${Math.max(0, top)}px`
      btn.style.display = 'block'
      return
    }
    btn.style.display = 'none'
    return
  }
  
  // Calculate position relative to viewport
  let left = rect.right + BUTTON_OFFSET.x
  let top = rect.top + BUTTON_OFFSET.y
  
  // Ensure button is within viewport
  if (left + 34 > window.innerWidth) {
    left = rect.left - 34 - BUTTON_OFFSET.x
  }
  if (top < 0) {
    top = rect.bottom + BUTTON_OFFSET.x
  }
  if (top + 34 > window.innerHeight) {
    top = window.innerHeight - 34 - 10
  }
  
  btn.style.left = `${Math.max(0, left)}px`
  btn.style.top = `${Math.max(0, top)}px`
  btn.style.display = 'block'
}

async function onTranslateClick(e){
  e.preventDefault()
  e.stopPropagation()
  
  const { text } = getSelectionTextAndRect()
  if (!text) {
    // Try to get text from button's data attribute as fallback
    const savedText = tooltipEl?.dataset?.selectedText
    if (!savedText) return
  }
  
  const wordToSave = text || tooltipEl?.dataset?.selectedText || ''
  if (!wordToSave) return
  
  createTooltip().style.display = 'none'
  showToast('Saving...')

  chrome.runtime.sendMessage({ 
    type: 'TRANSLATE_AND_SAVE', 
    apiBase: API_BASE, 
    word: wordToSave 
  }, (res) => {
    if (chrome.runtime.lastError) {
      showToast('Error: ' + chrome.runtime.lastError.message)
      return
    }
    if (!res?.ok) {
      if (res?.error === 'not_authenticated') {
        showToast('Please sign in from the extension popup.')
      } else {
        showToast('Failed: ' + (res?.error || 'unknown'))
      }
      return
    }
    showToast('Saved ✓')
    // Clear selection after saving
    window.getSelection()?.removeAllRanges()
  })
}

function updateFromSelection(fallbackPoint){
  clearTimeout(updateTimeout)
  
  updateTimeout = setTimeout(() => {
    const { text, rect } = getSelectionTextAndRect()
    
    if (!text || text.length < 1) {
      if (tooltipEl) {
        tooltipEl.style.display = 'none'
        tooltipEl.removeAttribute('data-selected-text')
      }
      return
    }
    
    // Store selected text in button for fallback
    if (tooltipEl) {
      tooltipEl.dataset.selectedText = text
    }
    
    positionTooltip(rect, fallbackPoint)
  }, 50) // Small delay to ensure selection is fully updated
}

// Handle mouse/pointer events
function handlePointerUp(e) {
  lastPointer = { x: e.clientX, y: e.clientY }
  // Small delay to let selection update
  setTimeout(() => {
    updateFromSelection(lastPointer)
  }, 100)
}

function handleMouseUp(e) {
  lastPointer = { x: e.clientX, y: e.clientY }
  setTimeout(() => {
    updateFromSelection(lastPointer)
  }, 100)
}

// Handle selection changes
function handleSelectionChange() {
  // Check if there's an active selection
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    if (tooltipEl) {
      tooltipEl.style.display = 'none'
    }
    return
  }
  
  updateFromSelection(lastPointer)
}

// Hide tooltip on various events
function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.style.display = 'none'
  }
}

// Event listeners with capture phase for better reliability
document.addEventListener('pointerup', handlePointerUp, true)
document.addEventListener('mouseup', handleMouseUp, true)
document.addEventListener('selectionchange', handleSelectionChange, true)

document.addEventListener('mousedown', (e) => {
  // Don't hide if clicking on the tooltip itself
  if (tooltipEl && tooltipEl.contains(e.target)) {
    return
  }
  hideTooltip()
}, true)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideTooltip()
    window.getSelection()?.removeAllRanges()
  }
}, true)

document.addEventListener('scroll', () => {
  // Update position on scroll instead of hiding
  if (tooltipEl && tooltipEl.style.display !== 'none') {
    updateFromSelection(lastPointer)
  }
}, true)

// Also listen for resize
window.addEventListener('resize', () => {
  if (tooltipEl && tooltipEl.style.display !== 'none') {
    updateFromSelection(lastPointer)
  }
})

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ensureStyle()
  })
} else {
  ensureStyle()
}


