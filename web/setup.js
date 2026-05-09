// Setup wizard logic
(function () {
  let currentStep = 1;

  // Solo redirigir si ya está configurado Y el usuario no ha empezado a rellenar el formulario
  fetch('/api/setup/status')
    .then(r => r.json())
    .then(data => {
      if (data.configured) {
        // Dar 300ms para que el usuario vea la página; no redirigir si ya escribió algo
        setTimeout(() => {
          const name = document.getElementById('company-name')?.value.trim();
          if (!name) window.location.href = '/panel';
        }, 300);
      }
    })
    .catch(() => {});

  window.nextStep = function (step) {
    if (step === 2) {
      const name = document.getElementById('company-name').value.trim();
      const sector = document.getElementById('sector').value;
      if (!name) {
        showError(1, 'Por favor introduce el nombre de la empresa.');
        return;
      }
      if (!sector) {
        showError(1, 'Por favor selecciona un sector.');
        return;
      }
    }
    showError(currentStep, '');
    document.getElementById('step-' + currentStep).classList.remove('active');
    document.getElementById('dot-' + currentStep).classList.remove('active');
    document.getElementById('dot-' + currentStep).classList.add('done');
    currentStep = step;
    document.getElementById('step-' + currentStep).classList.add('active');
    document.getElementById('dot-' + currentStep).classList.add('active');
  };

  window.finishSetup = async function () {
    const password = document.getElementById('panel-password').value;
    const confirm = document.getElementById('panel-password-confirm').value;

    if (password.length < 8) {
      showError(3, 'La contraseña debe tener mínimo 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      showError(3, 'Las contraseñas no coinciden.');
      return;
    }

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
    const el = document.getElementById('error-' + step);
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }
})();
