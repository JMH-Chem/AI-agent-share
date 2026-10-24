import { api } from './common.js';

const $ = (s) => document.querySelector(s);
const message = $('#message');

const go = (role) => (location.href = role === 'admin' ? '/admin' : '/chat');

// 이미 로그인되어 있으면 바로 이동
api('/session').then((s) => {
  if (s.loggedIn) go(s.role);
});

api('/config').then((cfg) => {
  document.title = `${cfg.className} 로그인`;
  $('#class-name').textContent = cfg.className;
  if (cfg.joinEnabled) $('#tabs').classList.remove('hidden');
});

for (const btn of document.querySelectorAll('#tabs button')) {
  btn.addEventListener('click', () => {
    for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('active', b === btn);
    $('#login-form').classList.toggle('hidden', btn.dataset.tab !== 'login');
    $('#signup-form').classList.toggle('hidden', btn.dataset.tab !== 'signup');
    message.textContent = '';
  });
}

async function submit(form, path) {
  message.textContent = '';
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const data = await api(path, { method: 'POST', body: Object.fromEntries(new FormData(form)) });
    go(data.role);
  } catch (err) {
    message.textContent = err.message;
  } finally {
    button.disabled = false;
  }
}

$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submit(e.target, '/login');
});
$('#signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submit(e.target, '/signup');
});
