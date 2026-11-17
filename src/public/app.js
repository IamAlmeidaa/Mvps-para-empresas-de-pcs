const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const form = document.querySelector('#lead-form');
const feedback = document.querySelector('#form-feedback');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  button.disabled = true;
  button.innerHTML = 'Enviando…';
  feedback.textContent = '';
  feedback.dataset.state = '';

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar agora.');
    form.reset();
    feedback.textContent = 'Interesse enviado. Obrigado pela mensagem!';
    feedback.dataset.state = 'success';
  } catch (error) {
    feedback.textContent = error.message.includes('DATABASE_URL')
      ? 'Formulário temporariamente indisponível. Escreva para oi@sinal.tech.'
      : error.message;
    feedback.dataset.state = 'error';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Enviar interesse <span>↗</span>';
  }
});
