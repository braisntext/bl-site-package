// Setup wizard logic
(function () {
  let currentStep = 1;

  // Redirect if already configured
  fetch('/api/setup/status')
    .then(r => r.json())
    .then(data => { if (data.configured) window.location.href = '/panel'; })
    .catch(() => {});

  window.nextStep = function (step) {
    if (step === 2) {
      const name = document.getElementById('company-name').value.trim();
      const sector = document.getElementById('sector').value;
      if (!name || !sector) {
        showError(1, 'Por favor completa el nombre y el sector.');
        return;
      }
    }
    showError(currentStep, '');
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`dot-${currentStep}`).classList.remove('active');
    document.getElementById(`dot-${currentStep}`).classList.add('done');
    currentStep = step;
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById(`dot-${currentStep}`).classList.add('active');
  };

  window.finishSetup = async function () {
    const password = document.getElementById('panel-password').value;
    const confirm = document.getElementById('panel-password-confirm').value;
    if (password.length < 8) { showError(3, 'La contraseña debe tener mínimo 8 caracteres.'); return; }
    if (password !== confirm) { showError(3, 'Las contraseñas no coinciden.'); return; }

    const btn = document.getElementById('finish-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: document.getElementById('company-name').value.trim(),
          sector: document.getElementById('sector').value,
          panelPassword: password,
          openrouterApiKey: document.getElementById('api-key').value.trim() || null
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/panel';
      } else {
        showError(3, data.error || 'Error al guardar la configuración.');
        btn.disabled = false;
        btn.textContent = 'Finalizar configuración';
      }
    } catch {
      showError(3, 'Error de conexión. Intenta de nuevo.');
      btn.disabled = false;
      btn.textContent = 'Finalizar configuración';
    }
  };

  function showError(step, msg) {
    const el = document.getElementById(`error-${step}`);
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  }
})();
