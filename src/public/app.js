const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const revealTargets = document.querySelectorAll(
  '.hero-copy, .hero-visual, .feature-card, .portfolio-card, .audience-section > *, .contact-copy, .contact-form',
);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  revealTargets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
    revealObserver.observe(element);
  });
}

const form = document.querySelector('#lead-form');
const feedback = document.querySelector('#form-feedback');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (form.dataset.submitting === 'true') return;

  const button = form.querySelector('button[type="submit"]');
  const originalContent = button.innerHTML;
  const data = Object.fromEntries(new FormData(form).entries());

  form.dataset.submitting = 'true';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = 'Enviando...';
  feedback.textContent = 'Enviando seu interesse com segurança...';
  feedback.dataset.state = 'loading';

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || result.message || 'Não foi possível enviar agora.');
    form.reset();
    feedback.textContent = 'Seu interesse foi registrado. Obrigado!';
    feedback.dataset.state = 'success';
  } catch (error) {
    feedback.textContent = error instanceof TypeError
      ? 'Não foi possível alcançar a API. Inicie o servidor Express e tente novamente.'
      : error.message;
    feedback.dataset.state = 'error';
  } finally {
    form.dataset.submitting = 'false';
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.innerHTML = originalContent;
  }
});
