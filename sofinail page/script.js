// Variables globales
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let visitCount = parseInt(localStorage.getItem('visitCount')) || 0;
let paymentHistory = JSON.parse(localStorage.getItem('paymentHistory')) || [];
let userPhone = localStorage.getItem('userPhone') || '';

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updatePointsDisplay();
    loadAppointments();
    loadPaymentHistory();
});

// Inicializar la aplicación
function initializeApp() {
    // Configurar navegación suave
    setupSmoothScrolling();
    
    // Configurar menú móvil
    setupMobileMenu();
    
    // Cargar datos del usuario
    loadUserData();
}

// Configurar navegación suave
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Configurar menú móvil
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de citas
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    }
    
    // Formulario de pago
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    // Configuración de notificaciones
    const phoneForm = document.getElementById('phone-form');
    if (phoneForm) {
        phoneForm.addEventListener('submit', handlePhoneSubmit);
    }
}

// Manejar envío de formulario de citas
function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const appointment = {
        id: Date.now(),
        service: formData.get('service'),
        date: formData.get('date'),
        time: formData.get('time'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        status: 'confirmada',
        createdAt: new Date().toISOString()
    };
    
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Agregar puntos por agendar cita
    addPoints(25, 'Cita agendada');
    
    showNotification('¡Cita agendada exitosamente!', 'success');
    e.target.reset();
    loadAppointments();
    
    // Enviar recordatorio por WhatsApp si hay número configurado
    if (userPhone) {
        sendAppointmentConfirmation(appointment);
    }
}

// Manejar envío de formulario de pago
function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const payment = {
        id: Date.now(),
        amount: parseFloat(formData.get('amount')),
        service: formData.get('service'),
        method: formData.get('method'),
        date: new Date().toISOString(),
        status: 'completado'
    };
    
    paymentHistory.push(payment);
    localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    
    // Agregar puntos por pago (1 punto por cada $10)
    const pointsEarned = Math.floor(payment.amount / 10);
    addPoints(pointsEarned, `Pago de $${payment.amount}`);
    
    showNotification(`Pago registrado. Ganaste ${pointsEarned} puntos!`, 'success');
    e.target.reset();
    loadPaymentHistory();
    
    // Enviar confirmación por WhatsApp
    if (userPhone) {
        sendPaymentConfirmation(payment);
    }
}

// Manejar configuración de teléfono
function handlePhoneSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    userPhone = formData.get('phone');
    localStorage.setItem('userPhone', userPhone);
    
    showNotification('Número de teléfono configurado correctamente', 'success');
    
    // Enviar mensaje de prueba
    sendTestMessage();
}

// Agregar puntos al usuario
function addPoints(points, reason) {
    userPoints += points;
    localStorage.setItem('userPoints', userPoints.toString());
    updatePointsDisplay();
    
    // Registrar la actividad
    const activity = {
        id: Date.now(),
        points: points,
        reason: reason,
        date: new Date().toISOString()
    };
    
    let activities = JSON.parse(localStorage.getItem('pointsActivities')) || [];
    activities.unshift(activity);
    localStorage.setItem('pointsActivities', JSON.stringify(activities));
}

// Actualizar visualización de puntos
function updatePointsDisplay() {
    const pointsElements = document.querySelectorAll('.points-display');
    pointsElements.forEach(element => {
        element.textContent = userPoints;
    });
    
    const levelElement = document.querySelector('.loyalty-level');
    if (levelElement) {
        levelElement.textContent = getLoyaltyLevel();
    }
}

// Obtener nivel de fidelidad
function getLoyaltyLevel() {
    if (visitCount >= 20) return 'Diamante';
    if (visitCount >= 15) return 'Oro';
    if (visitCount >= 10) return 'Plata';
    if (visitCount >= 5) return 'Bronce';
    return 'Nuevo';
}

// Cargar citas en la interfaz
function loadAppointments() {
    const appointmentsList = document.getElementById('appointments-list');
    if (!appointmentsList) return;
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>No tienes citas agendadas</p>
            </div>
        `;
        return;
    }
    
    appointmentsList.innerHTML = appointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-info">
                <h4>${appointment.service}</h4>
                <p><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</p>
                <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                <p><i class="fas fa-user"></i> ${appointment.name}</p>
            </div>
            <div class="appointment-status ${appointment.status}">
                ${appointment.status}
            </div>
            <button onclick="cancelAppointment(${appointment.id})" class="btn-cancel">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Cargar historial de pagos
function loadPaymentHistory() {
    const paymentsList = document.getElementById('payments-list');
    if (!paymentsList) return;
    
    if (paymentHistory.length === 0) {
        paymentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-credit-card"></i>
                <p>No hay pagos registrados</p>
            </div>
        `;
        return;
    }
    
    paymentsList.innerHTML = paymentHistory.map(payment => `
        <div class="payment-card">
            <div class="payment-info">
                <h4>$${payment.amount.toFixed(2)}</h4>
                <p>${payment.service}</p>
                <p><i class="fas fa-calendar"></i> ${formatDate(payment.date)}</p>
                <p><i class="fas fa-credit-card"></i> ${payment.method}</p>
            </div>
            <div class="payment-status ${payment.status}">
                ${payment.status}
            </div>
        </div>
    `).join('');
}

// Cancelar cita
function cancelAppointment(appointmentId) {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
        appointments = appointments.filter(app => app.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        loadAppointments();
        showNotification('Cita cancelada', 'info');
    }
}

// Enviar confirmación de cita por WhatsApp
function sendAppointmentConfirmation(appointment) {
    const message = `¡Hola ${appointment.name}! 👋

Tu cita en Sofí Nail ha sido confirmada:

📅 Fecha: ${formatDate(appointment.date)}
⏰ Hora: ${appointment.time}
💅 Servicio: ${appointment.service}

¡Te esperamos! Si necesitas reprogramar, contáctanos.

Sofí Nail - El cuidado de tus uñas 💖`;

    sendWhatsAppMessage(message, appointment.phone);
}

// Enviar confirmación de pago por WhatsApp
function sendPaymentConfirmation(payment) {
    const pointsEarned = Math.floor(payment.amount / 10);
    const message = `✅ Pago confirmado en Sofí Nail

💰 Monto: $${payment.amount}
📋 Servicio: ${payment.service}
📅 Fecha: ${formatDate(payment.date)}

¡Gracias por tu pago! Has ganado ${pointsEarned} puntos de fidelidad 🎉

Sofí Nail - El cuidado de tus uñas 💖`;

    sendWhatsAppMessage(message, userPhone);
}

// Enviar mensaje de prueba
function sendTestMessage() {
    const message = `¡Hola! 👋 Esta es una notificación de prueba de Sofí Nail.

Tu número está configurado correctamente para recibir:
• Confirmaciones de citas
• Confirmaciones de pago
• Recordatorios importantes

¡Gracias por elegirnos! 💖

Sofí Nail - El cuidado de tus uñas`;

    sendWhatsAppMessage(message, userPhone);
}

// Enviar mensaje por WhatsApp
function sendWhatsAppMessage(message, phone) {
    const formattedPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/54${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Cargar datos del usuario
function loadUserData() {
    // Cargar configuración de notificaciones si existe
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
        const phoneInput = document.getElementById('phone-config');
        if (phoneInput) {
            phoneInput.value = savedPhone;
        }
    }
}

// Canjear recompensa
function redeemReward(pointsRequired, rewardName) {
    if (userPoints >= pointsRequired) {
        if (confirm(`¿Deseas canjear "${rewardName}" por ${pointsRequired} puntos?`)) {
            userPoints -= pointsRequired;
            localStorage.setItem('userPoints', userPoints.toString());
            updatePointsDisplay();
            
            showNotification(`¡Recompensa "${rewardName}" canjeada exitosamente!`, 'success');
            
            // Registrar el canje
            const redemption = {
                id: Date.now(),
                reward: rewardName,
                points: pointsRequired,
                date: new Date().toISOString()
            };
            
            let redemptions = JSON.parse(localStorage.getItem('redemptions')) || [];
            redemptions.unshift(redemption);
            localStorage.setItem('redemptions', JSON.stringify(redemptions));
        }
    } else {
        showNotification(`Necesitas ${pointsRequired - userPoints} puntos más para canjear esta recompensa`, 'error');
    }
}

// Marcar asistencia a cita
function markAttendance(appointmentId) {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
        appointment.status = 'completada';
        visitCount++;
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        localStorage.setItem('visitCount', visitCount.toString());
        
        // Agregar puntos por asistencia
        addPoints(50, 'Asistencia a cita');
        
        showNotification('¡Asistencia registrada! +50 puntos', 'success');
        loadAppointments();
    }
}

// Funciones para el botón de cuenta mejorado

// Inicializar sistema de botón de cuenta - FUNCIÓN PRINCIPAL
function initializeAccountButton() {
    // Limpiar cualquier botón móvil existente
    const existingMobileBtn = document.querySelector('.mobile-account-btn');
    if (existingMobileBtn) {
        existingMobileBtn.remove();
    }
    
    // Solo agregar botón móvil si estamos en móvil
    if (window.innerWidth <= 768) {
        addMobileAccountButton();
    }
    
    updateAccountButton();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', debounce(function() {
        const existingBtn = document.querySelector('.mobile-account-btn');
        
        if (window.innerWidth <= 768) {
            // Estamos en móvil
            if (!existingBtn) {
                addMobileAccountButton();
            }
        } else {
            // Estamos en desktop
            if (existingBtn) {
                existingBtn.remove();
            }
        }
        updateAccountButton();
    }, 250));
}

// Agregar botón móvil al menú hamburguesa - MEJORADO
function addMobileAccountButton() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Verificar si ya existe para evitar duplicados
    if (document.querySelector('.mobile-account-btn')) {
        return;
    }
    
    const mobileAccountBtn = document.createElement('li');
    mobileAccountBtn.className = 'mobile-account-btn';
    mobileAccountBtn.innerHTML = `
        <button class="btn-account" onclick="openModal('loginModal')" id="mobileAccountButton">
            <div class="btn-account-content">
                <div class="btn-account-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="btn-account-text">
                    <span class="btn-account-label">Mi Cuenta</span>
                    <span class="btn-account-status" id="mobileAccountStatus">Iniciar Sesión</span>
                </div>
            </div>
        </button>
    `;
    
    navMenu.appendChild(mobileAccountBtn);
}

// Función debounce para optimizar el resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Actualizar el estado del botón de cuenta - MEJORADO
function updateAccountButton() {
    const accountButton = document.getElementById('accountButton');
    const accountStatus = document.getElementById('accountStatus');
    const accountNotification = document.getElementById('accountNotification');
    
    // También actualizar el botón móvil
    const mobileAccountButton = document.getElementById('mobileAccountButton');
    const mobileAccountStatus = document.getElementById('mobileAccountStatus');
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Función para actualizar un botón
    function updateButton(button, status, notification) {
        if (!button) return;
        
        if (userData.isLoggedIn) {
            // Usuario logueado
            button.classList.add('logged-in');
            if (status) {
                status.textContent = userData.name ? userData.name.split(' ')[0] : 'Usuario';
            }
            
            // Mostrar notificación si hay puntos nuevos
            const hasNewPoints = localStorage.getItem('hasNewPoints') === 'true';
            if (notification) {
                notification.style.display = hasNewPoints ? 'block' : 'none';
            }
        } else {
            // Usuario no logueado
            button.classList.remove('logged-in');
            if (status) {
                status.textContent = 'Iniciar Sesión';
            }
            if (notification) {
                notification.style.display = 'none';
            }
        }
    }
    
    // Actualizar ambos botones
    updateButton(accountButton, accountStatus, accountNotification);
    updateButton(mobileAccountButton, mobileAccountStatus, null);
}

// Funciones de notificación del botón
function setAccountButtonLoading(isLoading) {
    const buttons = [
        document.getElementById('accountButton'),
        document.getElementById('mobileAccountButton')
    ];
    
    buttons.forEach(button => {
        if (button) {
            if (isLoading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }
    });
}

function showAccountNotification() {
    const notification = document.getElementById('accountNotification');
    if (notification) {
        notification.style.display = 'block';
        localStorage.setItem('hasNewPoints', 'true');
    }
}

function hideAccountNotification() {
    const notification = document.getElementById('accountNotification');
    if (notification) {
        notification.style.display = 'none';
        localStorage.setItem('hasNewPoints', 'false');
    }
}

// Actualizar el botón cuando cambia el localStorage
window.addEventListener('storage', function(e) {
    if (e.key && e.key.includes('userData')) {
        updateAccountButton();
    }
});