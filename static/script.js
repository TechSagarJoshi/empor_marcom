/* ═══════════════════════════════════════════════
   EMPOR MARCOM — Main JavaScript
   Chatbot · Animations · UI Interactions
   ═══════════════════════════════════════════════ */

// ── Page Loader ─────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden');
  }, 1200);
});

// ── Navbar Scroll Shrink ─────────────────────────
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
});

// ── Active Nav Link ──────────────────────────────
(function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '/' && href === '/') ||
        (path.includes(href) && href !== '/')) {
      a.classList.add('active');
    }
  });
})();

// ── Mobile Menu ──────────────────────────────────
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileClose = document.querySelector('.mobile-close');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  document.body.style.overflow = mobileMenu?.classList.contains('open') ? 'hidden' : '';
});
mobileClose?.addEventListener('click', closeMobileMenu);
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));

function closeMobileMenu() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Dark / Light Mode Toggle ─────────────────────
const darkToggle = document.querySelector('.dark-toggle');
const stored = localStorage.getItem('theme');
if (stored === 'light') document.body.classList.add('light-mode');

darkToggle?.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  darkToggle.innerHTML = isLight ? '☀️' : '🌙';
});
if (stored === 'light' && darkToggle) darkToggle.innerHTML = '☀️';

// ── Scroll Fade-In Observer ──────────────────────
const fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => fadeObserver.observe(el));

// ── Animated Counters ────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ── Marquee Pause on Hover ───────────────────────
const marquee = document.querySelector('.clients-inner');
marquee?.parentElement?.addEventListener('mouseenter', () => {
  if (marquee) marquee.style.animationPlayState = 'paused';
});
marquee?.parentElement?.addEventListener('mouseleave', () => {
  if (marquee) marquee.style.animationPlayState = 'running';
});

// ══════════════════════════════════════════════════
//  CHATBOT
// ══════════════════════════════════════════════════

const CLAUDE_API_KEY = ''; // Add your Anthropic API key here

// Chatbot state
let chatState = {
  step: 0,
  data: {},
  history: [],
  isOpen: false,
  isTyping: false,
};

const CHAT_STEPS = [
  {
    key: null,
    message: "👋 Hi there! I'm **Aria**, Empor Marcom's AI assistant.\n\nI help connect businesses with the right marketing solutions. Let's get started — what's your **company name**?",
    quickReplies: [],
  },
  {
    key: 'company',
    message: "Great to meet you from **{company}**! 🎉\n\nWhat's your **role** there?",
    quickReplies: ['CEO / Founder', 'Marketing Head', 'Sales Manager', 'Business Development'],
  },
  {
    key: 'role',
    message: "Perfect. And how large is **{company}**?",
    quickReplies: ['1–10 employees', '11–50 employees', '51–200 employees', '200+ employees'],
  },
  {
    key: 'companySize',
    message: "Got it! Which of our **services** are you most interested in?",
    quickReplies: ['Lead Generation', 'Webinars & Events', 'Content Marketing', 'Performance Marketing'],
  },
  {
    key: 'service',
    message: "Excellent choice! **{service}** is one of our strongest offerings. What's your **timeline** to get started?",
    quickReplies: ['ASAP', 'Within 1 month', '1–3 months', 'Just exploring'],
  },
  {
    key: 'timeline',
    message: "Almost there! 📧 What's the best **email address** to reach you?",
    quickReplies: [],
  },
  {
    key: 'email',
    message: "And your **phone number**? (We promise — no spam calls!)",
    quickReplies: [],
  },
  {
    key: 'phone',
    message: "🎉 All set! Here's a summary of your request:\n\n🏢 **{company}**\n👤 {role} · {companySize}\n📌 {service}\n⏱ {timeline}\n📧 {email}\n📱 {phone}\n\nOur team will reach out within **24 hours**. Is there anything else you'd like to know?",
    quickReplies: ['Tell me about your services', 'View case studies', 'No, thanks!'],
    isFinal: true,
  },
];

// DOM Elements
const chatToggle   = document.getElementById('chat-toggle');
const chatWindow   = document.getElementById('chatbot-window');
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');
const chatReset    = document.getElementById('chat-reset');
const chatClose    = document.getElementById('chat-close');

// Load or init chat history
function loadChatState() {
  try {
    const saved = localStorage.getItem('empor_chat');
    if (saved) {
      const parsed = JSON.parse(saved);
      chatState = { ...chatState, ...parsed, isOpen: false };
    }
  } catch (e) { /* ignore */ }
}

function saveChatState() {
  try {
    const { isOpen, isTyping, ...toSave } = chatState;
    localStorage.setItem('empor_chat', JSON.stringify(toSave));
  } catch (e) { /* ignore */ }
}

function resetChat() {
  chatState = { step: 0, data: {}, history: [], isOpen: true, isTyping: false };
  localStorage.removeItem('empor_chat');
  if (chatMessages) chatMessages.innerHTML = '';
  startChat();
}

// Toggle chatbot window
chatToggle?.addEventListener('click', () => {
  chatState.isOpen = !chatState.isOpen;
  chatWindow?.classList.toggle('open', chatState.isOpen);

  // First open
  if (chatState.isOpen && chatMessages && chatMessages.children.length === 0) {
    startChat();
  }

  // Hide notification dot
  const dot = chatToggle.querySelector('.notif-dot');
  if (dot) dot.style.display = 'none';

  // Toggle icon
  chatToggle.innerHTML = chatState.isOpen
    ? `<span style="font-size:1.3rem">✕</span>`
    : `<span style="font-size:1.4rem">💬</span><span class="notif-dot" style="display:none">1</span>`;
});

chatClose?.addEventListener('click', () => {
  chatState.isOpen = false;
  chatWindow?.classList.remove('open');
  chatToggle.innerHTML = `<span style="font-size:1.4rem">💬</span>`;
});

chatReset?.addEventListener('click', resetChat);

// Input send
chatSend?.addEventListener('click', handleUserInput);
chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInput(); }
});

function startChat() {
  loadChatState();
  if (chatState.history.length > 0) {
    // Replay history
    chatState.history.forEach(msg => {
      appendMessage(msg.type, msg.text, false);
    });
  } else {
    sendBotMessage(CHAT_STEPS[0].message, CHAT_STEPS[0].quickReplies, false);
  }
}

function handleUserInput() {
  const val = chatInput?.value.trim();
  if (!val || chatState.isTyping) return;
  chatInput.value = '';

  // Validate based on step
  const currentStep = CHAT_STEPS[chatState.step];
  const keyToCapture = chatState.step > 0 ? CHAT_STEPS[chatState.step - 1]?.key : null;

  if (keyToCapture === 'email' && !isValidEmail(val)) {
    appendMessage('bot', '⚠️ Please enter a valid email address (e.g. name@company.com)', true);
    return;
  }
  if (keyToCapture === 'phone' && !isValidPhone(val)) {
    appendMessage('bot', '⚠️ Please enter a valid 10-digit phone number.', true);
    return;
  }

  processUserMessage(val);
}

function processUserMessage(text) {
  appendMessage('user', text, true);

  const step = chatState.step;
  if (step > 0 && CHAT_STEPS[step - 1]?.key) {
    chatState.data[CHAT_STEPS[step - 1].key] = text;
  }

  saveChatState();

  if (step >= CHAT_STEPS.length) {
    handlePostFlow(text);
    return;
  }

  const nextStep = CHAT_STEPS[step];
  const msg = interpolate(nextStep.message, chatState.data);
  const qr  = nextStep.quickReplies || [];

  chatState.step++;
  saveChatState();

  setTimeout(() => {
    showTyping(() => {
      sendBotMessage(msg, qr, true);
      if (nextStep.isFinal) saveLead();
    });
  }, 400);
}

function handlePostFlow(text) {
  const lower = text.toLowerCase();
  let reply = "Thanks for reaching out! 😊 Our team will contact you shortly. Feel free to visit our website or call us at +91-XXXXXXXXXX.";
  if (lower.includes('service')) reply = "We specialize in Lead Generation, Webinars & Events, Content Marketing, and Performance Marketing. Visit our Services page for details!";
  if (lower.includes('case') || lower.includes('stud')) reply = "We've delivered great results for clients across B2B sectors. Check our website for case studies and testimonials!";

  showTyping(() => sendBotMessage(reply, ['Start Over', 'Visit Services', 'Contact Us'], true));
}

function appendMessage(type, text, save = false) {
  if (!chatMessages) return;

  const wrapper = document.createElement('div');
  wrapper.className = `msg ${type}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatText(text);

  if (type === 'bot') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = '🤖';
    wrapper.appendChild(avatar);
  }

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  scrollChat();

  if (save) {
    chatState.history.push({ type, text });
    saveChatState();
  }
}

function sendBotMessage(text, quickReplies = [], save = false) {
  if (!chatMessages) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'msg bot';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🤖';

  const right = document.createElement('div');
  right.style.flex = '1';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatText(text);

  right.appendChild(bubble);

  if (quickReplies.length > 0) {
    const qrWrap = document.createElement('div');
    qrWrap.className = 'quick-replies';
    quickReplies.forEach(qr => {
      const btn = document.createElement('button');
      btn.className = 'qr-btn';
      btn.textContent = qr;
      btn.addEventListener('click', () => {
        qrWrap.remove();
        processUserMessage(qr);
      });
      qrWrap.appendChild(btn);
    });
    right.appendChild(qrWrap);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(right);
  chatMessages.appendChild(wrapper);
  scrollChat();

  if (save) {
    chatState.history.push({ type: 'bot', text });
    saveChatState();
  }
}

function showTyping(callback) {
  if (!chatMessages) return;
  chatState.isTyping = true;

  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🤖';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';

  wrap.appendChild(avatar);
  wrap.appendChild(dots);
  chatMessages.appendChild(wrap);
  scrollChat();

  const delay = 800 + Math.random() * 600;
  setTimeout(() => {
    document.getElementById('typing-indicator')?.remove();
    chatState.isTyping = false;
    callback();
  }, delay);
}

function scrollChat() {
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function interpolate(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] || `_${key}_`);
}

function formatText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ── Save Lead to Backend ─────────────────────────
async function saveLead() {
  const payload = { ...chatState.data };
  try {
    const res = await fetch('/save_chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    console.log('Lead saved:', json);
  } catch (err) {
    console.warn('Could not save lead (backend may not be running):', err.message);
  }
}

// ── Claude AI fallback (optional) ───────────────
async function askClaude(userMessage) {
  if (!CLAUDE_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are Aria, a friendly AI assistant for Empor Marcom, a B2B marketing agency in Delhi, India. Keep responses brief and helpful. Services: Lead Generation, Webinars & Events, Content Marketing, Performance Marketing.',
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

// ── Validation ───────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-()]/g, ''));
}

// ── Contact Form ─────────────────────────────────
const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('[type="submit"]');
  const name    = document.getElementById('cf-name')?.value.trim();
  const email   = document.getElementById('cf-email')?.value.trim();
  const phone   = document.getElementById('cf-phone')?.value.trim();
  const message = document.getElementById('cf-message')?.value.trim();

  // Validate
  if (!name || !email || !message) { showFormError('Please fill in all required fields.'); return; }
  if (!isValidEmail(email)) { showFormError('Please enter a valid email address.'); return; }
  if (phone && !isValidPhone(phone)) { showFormError('Phone must be 10 digits.'); return; }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    await fetch('/save_contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, message }),
    });
    document.getElementById('contact-form-wrap')?.style.setProperty('display', 'none');
    document.getElementById('form-success')?.classList.add('show');
  } catch {
    btn.disabled = false;
    btn.textContent = 'Send Message';
    showFormError('Something went wrong. Please try again.');
  }
});

function showFormError(msg) {
  let err = document.getElementById('form-error');
  if (!err) {
    err = document.createElement('p');
    err.id = 'form-error';
    err.style.cssText = 'color:#FF5A1F;font-size:0.85rem;margin-top:0.5rem;';
    contactForm?.appendChild(err);
  }
  err.textContent = msg;
  setTimeout(() => err?.remove(), 4000);
}

// ── Career Form ──────────────────────────────────
const careerForm = document.getElementById('career-form');
careerForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = careerForm.querySelector('[type="submit"]');
  btn.textContent = '✅ Application Submitted!';
  btn.disabled = true;
  btn.style.background = 'linear-gradient(135deg,#4ECDC4,#44A8A2)';
  setTimeout(() => {
    btn.textContent = 'Submit Application';
    btn.disabled = false;
    btn.style.background = '';
    careerForm.reset();
    document.getElementById('file-name-display').textContent = '';
  }, 4000);
});

// File upload display
const fileInput = document.getElementById('resume-file');
fileInput?.addEventListener('change', () => {
  const name = fileInput.files[0]?.name;
  if (name) {
    const display = document.getElementById('file-name-display');
    if (display) display.textContent = `📎 ${name}`;
  }
});

// Drag & drop resume
const dropZone = document.getElementById('drop-zone');
dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
dropZone?.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
dropZone?.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '';
  if (fileInput && e.dataTransfer.files[0]) {
    const dt = new DataTransfer();
    dt.items.add(e.dataTransfer.files[0]);
    fileInput.files = dt.files;
    const display = document.getElementById('file-name-display');
    if (display) display.textContent = `📎 ${e.dataTransfer.files[0].name}`;
  }
});
dropZone?.addEventListener('click', () => fileInput?.click());

// ── Gallery Lightbox ─────────────────────────────
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const label = item.querySelector('.gallery-overlay span')?.textContent || 'Life at Empor';
    showLightbox(label);
  });
});

function showLightbox(label) {
  const lb = document.createElement('div');
  lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9000;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(10px)`;
  lb.innerHTML = `<div style="text-align:center;color:white;font-family:var(--font-head)"><div style="font-size:4rem;margin-bottom:1rem">📸</div><p style="font-size:1.2rem;font-weight:700">${label}</p><p style="color:#8892B0;margin-top:0.5rem;font-size:0.9rem">Click anywhere to close</p></div>`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

// ── Smooth scroll for anchor links ──────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── Parallax Hero ────────────────────────────────
const heroBlobs = document.querySelectorAll('.hero-blob');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  heroBlobs.forEach((blob, i) => {
    blob.style.transform = `translateY(${y * (i === 0 ? 0.15 : -0.1)}px)`;
  });
}, { passive: true });

// ── Init on DOM Ready ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Re-run observer for dynamically loaded elements
  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    fadeObserver.observe(el);
  });
});
