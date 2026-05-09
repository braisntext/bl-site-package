document.addEventListener('DOMContentLoaded', function () {
  var currentStep = 1;

  fetch('/api/setup/status')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.configured) window.location.href = '/panel';
    })
    .catch(function () {});

  document.getElementById('btn-step1').addEventListener('click', function () {
    var name = document.getElementById('company-name').value.trim();
    var sector = document.getElementById('sector').value;
    if (!name) { showError(1, 'Introduce el nombre de la empresa.'); return; }
    if (!sector) { showError(1, 'Selecciona un sector.'); return; }
    goToStep(2);
  });

  document.getElementById('btn-step2').addEventListener('click', function () {
    goToStep(3);
  });

  document.getElementById('btn-skip2').addEventListener('click', function () {
    goToStep(3);
  });

  document.getElementById('finish-btn').addEventListener('click', finishSetup);

  document.getElementById('company-name').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-step1').click();
  });
  document.getElementById('panel-password-confirm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') finishSetup();
  });

  function goToStep(step) {
    showError(currentStep, '');
    document.getElementById('step-' + currentStep).classList.remove('active');
    document.getElementById('dot-' + currentStep).classList.remove('active');
    document.getElementById('dot-' + currentStep).classList.add('done');
    currentStep = step;
    document.getElementById('step-' + currentStep).classList.add('active');
    document.getElementById('dot-' + currentStep).classList.add('active');
  }

  async function finishSetup() {
    var password = document.getElementById('panel-password').value;
    var confirm = document.getElementById('panel-password-confirm').value;
    if (password.length < 8) { showError(3, 'La contraseña debe tener mínimo 8 caracteres.'); return; }
    if (password !== confirm) { showError(3, 'Las contraseñas no coinciden.'); return; }

    var btn = document.getElementById('finish-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      var res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: document.getElementById('company-name').value.trim(),
          sector: document.getElementById('sector').value,
          panelPassword: password,
          openrouterApiKey: document.getElementById('api-key').value.trim() || null
        })
      });
      var data = await res.json();
      if (data.success) {
        window.location.href = '/panel';
      } else {
        showError(3, data.error || 'Error al guardar la configuración.');
        btn.disabled = false;
        btn.textContent = 'Finalizar configuración';
      }
    } catch (err) {
      showError(3, 'Error de conexión. Intenta de nuevo.');
      btn.disabled = false;
      btn.textContent = 'Finalizar configuración';
    }
  }

  function showError(step, msg) {
    var el = document.getElementById('error-' + step);
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }
});
