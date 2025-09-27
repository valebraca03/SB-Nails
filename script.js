// Variables globales
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let visitCount = parseInt(localStorage.getItem('visitCount')) || 0;
let paymentHistory = JSON.parse(localStorage.getItem('paymentHistory')) || [];
let userPhone = localStorage.getItem('userPhone') || '';

// Variables para la galería con carrusel 3D
let currentServiceGallery = null;
let currentImageIndex = 0;
let galleryImages = [];
let carouselContainer = null;
let isAnimating = false;

// Datos de imágenes para cada servicio (puedes agregar más imágenes reales)
const serviceGalleries = {
    'semipermanente': {
        name: 'Semipermanente',
        images: [
            'Fotos/semipermanente1.jpg',
            'Fotos/semipermanente2.jpg',
            'Fotos/semipermanente3.jpg',
            'Fotos/semipermanente4.jpg',
            'Fotos/semipermanente5.jpg'
        ]
    },
    'capping-gel': {
        name: 'Capping Gel',
        images: [
            'Fotos/capping-gel1.jpg',
            'Fotos/capping-gel2.jpg',
            'Fotos/capping-gel3.jpg',
            'Fotos/capping-gel4.jpg'
        ]
    },
    'soft-gel': {
        name: 'Soft Gel',
        images: [
            'Fotos/soft-gel1.jpg',
            'Fotos/soft-gel2.jpg',
            'Fotos/soft-gel3.jpg',
            'Fotos/soft-gel4.jpg'
        ]
    },
    'capping-polygel': {
        name: 'Capping Polygel',
        images: [
            'Fotos/capping-polygel1.jpg',
            'Fotos/capping-polygel2.jpg',
            'Fotos/capping-polygel3.jpg',
            'Fotos/capping-polygel4.jpg'
        ]
    },
    'retiro': {
        name: 'Retiro',
        images: [
            'Fotos/retiro1.jpg',
            'Fotos/retiro2.jpg',
            'Fotos/retiro3.jpg'
        ]
    },
    'belleza-pies': {
        name: 'Belleza de Pies',
        images: [
            'Fotos/belleza-pies1.jpg',
            'Fotos/belleza-pies2.jpg',
            'Fotos/belleza-pies3.jpg',
            'Fotos/belleza-pies4.jpg'
        ]
    }
};

// Variables para el modal de agendamiento
let modalCurrentStep = 1;
let modalSelectedService = null;
let modalSelectedDate = null;
let modalSelectedTime = null;
let modalCurrentDate = new Date();

// Variables para el modo de autenticación
let isRegisterMode = true;

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

// Formatear fecha (unificada)
function formatDate(dateInput) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Para formularios (formato ISO)
    if (arguments[1] === 'iso') {
        return date.toISOString().split('T')[0];
    }
    
    // Para mostrar al usuario (formato español)
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

// Variables globales para el calendario
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let availableSlots = {};

// Horarios de trabajo
const workingHours = {
    monday: { start: 9, end: 19, slots: [] },
    tuesday: { start: 9, end: 19, slots: [] },
    wednesday: { start: 9, end: 19, slots: [] },
    thursday: { start: 9, end: 19, slots: [] },
    friday: { start: 9, end: 19, slots: [] },
    saturday: { start: 9, end: 17, slots: [] },
    sunday: { closed: true }
};

// Citas ocupadas (simuladas - en una app real vendrían de una base de datos)
const occupiedSlots = {
    '2025-01-15': ['10:00', '14:00', '16:30'],
    '2025-01-16': ['11:00', '15:00'],
    '2025-01-18': ['09:30', '13:00', '17:00']
};

// Inicializar calendario cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupCalendarEventListeners();
    generateTimeSlots();
});

// Inicializar el calendario
function initializeCalendar() {
    renderCalendar();
    updateMonthDisplay();
}

// Configurar event listeners del calendario
function setupCalendarEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        updateMonthDisplay();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        updateMonthDisplay();
    });
    
    // Event listener para el formulario
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentSubmit);
    
    // Event listener para cambio de servicio
    document.getElementById('selectedService').addEventListener('change', updateAppointmentSummary);
}

// Renderizar el calendario
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) {
        console.warn('Elemento calendarDays no encontrado');
        return;
    }
    calendarDays.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para que la semana empiece en lunes
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = createDayElement(date, month);
        calendarDays.appendChild(dayElement);
    }
}

// Crear elemento de día
function createDayElement(date, currentMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    const dayStatus = document.createElement('div');
    dayStatus.className = 'day-status';
    
    // Determinar el estado del día
    const dateString = formatDate(date);
    const dayOfWeek = getDayOfWeek(date.getDay());
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = isDateToday(date);
    const isPast = date < new Date().setHours(0, 0, 0, 0);
    
    // Agregar clases según el estado
    if (!isCurrentMonth) {
        dayDiv.classList.add('other-month');
    }
    
    if (isToday) {
        dayDiv.classList.add('today');
    }
    
    if (isPast) {
        dayDiv.classList.add('closed');
        dayStatus.textContent = 'Pasado';
    } else if (workingHours[dayOfWeek]?.closed) {
        dayDiv.classList.add('closed');
        dayStatus.textContent = 'Cerrado';
    } else if (occupiedSlots[dateString] && occupiedSlots[dateString].length >= getMaxSlotsForDay(dayOfWeek)) {
        dayDiv.classList.add('occupied');
        dayStatus.textContent = 'Completo';
    } else if (isCurrentMonth && !isPast) {
        dayDiv.classList.add('available');
        dayStatus.textContent = 'Disponible';
        dayDiv.addEventListener('click', () => selectDate(date));
    }
    
    dayDiv.appendChild(dayNumber);
    dayDiv.appendChild(dayStatus);
    
    return dayDiv;
}

// Seleccionar fecha
function selectDate(date) {
    // Remover selección anterior
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Seleccionar nueva fecha
    event.target.closest('.calendar-day').classList.add('selected');
    selectedDate = date;
    
    // Mostrar horarios disponibles
    showTimeSlots(date);
}

// Mostrar horarios disponibles
function showTimeSlots(date) {
    const container = document.getElementById('timeSlotsContainer');
    const dateDisplay = document.getElementById('selectedDateDisplay');
    const timeSlotsDiv = document.getElementById('timeSlots');
    
    dateDisplay.textContent = formatDateDisplay(date);
    
    // Generar horarios para el día seleccionado
    const dayOfWeek = getDayOfWeek(date.getDay());
    const dateString = formatDate(date);
    const slots = generateSlotsForDay(dayOfWeek, dateString);
    
    timeSlotsDiv.innerHTML = '';
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        
        if (slot.occupied) {
            slotDiv.classList.add('occupied');
        }
        
        slotDiv.innerHTML = `
            <div class="time-slot-time">${slot.time}</div>
            <div class="time-slot-status">${slot.occupied ? 'Ocupado' : 'Disponible'}</div>
        `;
        
        if (!slot.occupied) {
            slotDiv.addEventListener('click', () => selectTimeSlot(slot.time, slotDiv));
        }
        
        timeSlotsDiv.appendChild(slotDiv);
    });
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

// Seleccionar horario
function selectTimeSlot(time, element) {
    // Remover selección anterior
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Seleccionar nuevo horario
    element.classList.add('selected');
    selectedTime = time;
    
    // Mostrar formulario
    showBookingForm();
}

// Mostrar formulario de reserva
function showBookingForm() {
    const container = document.getElementById('bookingFormContainer');
    const confirmDate = document.getElementById('confirmDate');
    const confirmTime = document.getElementById('confirmTime');
    
    confirmDate.textContent = formatDateDisplay(selectedDate);
    confirmTime.textContent = selectedTime;
    
    updateAppointmentSummary();
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

// Actualizar resumen de la cita
function updateAppointmentSummary() {
    const serviceSelect = document.getElementById('selectedService');
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    
    if (selectedOption.value && selectedDate && selectedTime) {
        const serviceName = selectedOption.textContent.split(' - ')[0];
        const price = selectedOption.dataset.price;
        const duration = selectedOption.dataset.duration;
        
        document.getElementById('summaryService').textContent = serviceName;
        document.getElementById('summaryDate').textContent = formatDateDisplay(selectedDate);
        document.getElementById('summaryTime').textContent = selectedTime;
        document.getElementById('summaryDuration').textContent = duration;
        document.getElementById('summaryPrice').textContent = price;
    }
}

// Generar horarios para un día
function generateSlotsForDay(dayOfWeek, dateString) {
    const slots = [];
    const workDay = workingHours[dayOfWeek];
    
    if (workDay.closed) return slots;
    
    for (let hour = workDay.start; hour < workDay.end; hour++) {
        for (let minutes of [0, 30]) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const occupied = occupiedSlots[dateString]?.includes(timeString) || false;
            
            slots.push({
                time: timeString,
                occupied: occupied
            });
        }
    }
    
    return slots;
}

// Manejar envío del formulario
function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const appointment = {
        id: Date.now(),
        service: formData.get('selectedService'),
        date: formatDate(selectedDate),
        time: selectedTime,
        name: formData.get('clientName'),
        phone: formData.get('clientPhone'),
        notes: formData.get('notes'),
        status: 'confirmada',
        createdAt: new Date().toISOString()
    };
    
    // Guardar cita
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Agregar a horarios ocupados
    if (!occupiedSlots[appointment.date]) {
        occupiedSlots[appointment.date] = [];
    }
    occupiedSlots[appointment.date].push(appointment.time);
    
    // Mostrar mensaje de éxito
    showSuccessMessage('¡Cita agendada exitosamente!', 
        `Tu cita para ${appointment.service} el ${formatDateDisplay(selectedDate)} a las ${selectedTime} ha sido confirmada.`);
    
    // Resetear formulario
    resetBooking();
    
    // Agregar puntos por agendar cita
    addPoints(25, 'Cita agendada');
}

// Resetear proceso de reserva
function resetBooking() {
    selectedDate = null;
    selectedTime = null;
    
    document.getElementById('timeSlotsContainer').style.display = 'none';
    document.getElementById('bookingFormContainer').style.display = 'none';
    
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    document.getElementById('appointmentForm').reset();
    renderCalendar();
}

// Funciones auxiliares


function formatDateDisplay(date) {
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateMonthDisplay() {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function getDayOfWeek(dayIndex) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
}

function isDateToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function getMaxSlotsForDay(dayOfWeek) {
    const workDay = workingHours[dayOfWeek];
    if (workDay.closed) return 0;
    return (workDay.end - workDay.start) * 2; // 2 slots por hora (cada 30 min)
}

function generateTimeSlots() {
    // Esta función se puede usar para pre-generar slots si es necesario
    Object.keys(workingHours).forEach(day => {
        if (!workingHours[day].closed) {
            workingHours[day].slots = [];
            for (let hour = workingHours[day].start; hour < workingHours[day].end; hour++) {
                for (let minutes of [0, 30]) {
                    workingHours[day].slots.push(
                        `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                    );
                }
            }
        }
    });
}

// Función para abrir el modal de agendamiento
function openBookingModal() {
    resetModalBooking();
    openModal('bookingModal');
    initializeModalCalendar();
}

// Función para resetear el modal
function resetModalBooking() {
    modalCurrentStep = 1;
    modalSelectedService = null;
    modalSelectedDate = null;
    modalSelectedTime = null;
    
    // Resetear pasos visuales
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.getElementById('step1').classList.add('active');
    
    // Mostrar solo el primer paso
    document.querySelectorAll('.booking-step-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('serviceSelection').style.display = 'block';
    
    // Resetear botones
    document.getElementById('modalPrevBtn').style.display = 'none';
    document.getElementById('modalNextBtn').style.display = 'block';
    document.getElementById('modalConfirmBtn').style.display = 'none';
    
    // Limpiar selecciones
    document.querySelectorAll('.service-modal-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Limpiar formulario
    document.getElementById('modalAppointmentForm').reset();
}

// Función para seleccionar servicio en el modal
function selectModalService(serviceId, serviceName, price, duration) {
    modalSelectedService = {
        id: serviceId,
        name: serviceName,
        price: price,
        duration: duration
    };
    
    // Actualizar selección visual
    document.querySelectorAll('.service-modal-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-service="${serviceId}"]`).classList.add('selected');
}

// Función para avanzar al siguiente paso
function nextModalStep() {
    if (modalCurrentStep === 1 && !modalSelectedService) {
        showNotification('Por favor selecciona un servicio', 'warning');
        return;
    }
    
    if (modalCurrentStep === 2 && !modalSelectedDate) {
        showNotification('Por favor selecciona una fecha', 'warning');
        return;
    }
    
    if (modalCurrentStep === 3 && !modalSelectedTime) {
        showNotification('Por favor selecciona un horario', 'warning');
        return;
    }
    
    modalCurrentStep++;
    updateModalStep();
}

// Función para retroceder al paso anterior
function previousModalStep() {
    modalCurrentStep--;
    updateModalStep();
}

// Función para actualizar el paso del modal
function updateModalStep() {
    // Actualizar pasos visuales
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < modalCurrentStep) {
            step.classList.add('completed');
        } else if (index + 1 === modalCurrentStep) {
            step.classList.add('active');
        }
    });
    
    // Mostrar contenido del paso actual
    document.querySelectorAll('.booking-step-content').forEach(content => {
        content.style.display = 'none';
    });
    
    switch (modalCurrentStep) {
        case 1:
            document.getElementById('serviceSelection').style.display = 'block';
            document.getElementById('modalPrevBtn').style.display = 'none';
            document.getElementById('modalNextBtn').style.display = 'block';
            document.getElementById('modalConfirmBtn').style.display = 'none';
            break;
        case 2:
            document.getElementById('dateSelection').style.display = 'block';
            document.getElementById('modalPrevBtn').style.display = 'block';
            document.getElementById('modalNextBtn').style.display = 'block';
            document.getElementById('modalConfirmBtn').style.display = 'none';
            renderModalCalendar();
            break;
        case 3:
            document.getElementById('timeSelection').style.display = 'block';
            document.getElementById('modalPrevBtn').style.display = 'block';
            document.getElementById('modalNextBtn').style.display = 'block';
            document.getElementById('modalConfirmBtn').style.display = 'none';
            showModalTimeSlots();
            break;
        case 4:
            document.getElementById('clientData').style.display = 'block';
            document.getElementById('modalPrevBtn').style.display = 'block';
            document.getElementById('modalNextBtn').style.display = 'none';
            document.getElementById('modalConfirmBtn').style.display = 'block';
            updateModalSummary();
            break;
    }
}

// Función para inicializar el calendario del modal
function initializeModalCalendar() {
    modalCurrentDate = new Date();
    
    // Event listeners para navegación del calendario
    document.getElementById('modalPrevMonth').addEventListener('click', () => {
        modalCurrentDate.setMonth(modalCurrentDate.getMonth() - 1);
        renderModalCalendar();
    });
    
    document.getElementById('modalNextMonth').addEventListener('click', () => {
        modalCurrentDate.setMonth(modalCurrentDate.getMonth() + 1);
        renderModalCalendar();
    });
}

// Función para renderizar el calendario del modal
function renderModalCalendar() {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    document.getElementById('modalCurrentMonth').textContent = 
        `${monthNames[modalCurrentDate.getMonth()]} ${modalCurrentDate.getFullYear()}`;
    
    const firstDay = new Date(modalCurrentDate.getFullYear(), modalCurrentDate.getMonth(), 1);
    const lastDay = new Date(modalCurrentDate.getFullYear(), modalCurrentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Empezar en lunes
    
    const calendarDays = document.getElementById('modalCalendarDays');
    calendarDays.innerHTML = '';
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = createModalDayElement(currentDate, modalCurrentDate.getMonth());
        calendarDays.appendChild(dayElement);
    }
}

// Función para crear elemento de día en el modal
function createModalDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'modal-calendar-day';
    dayElement.textContent = date.getDate();
    
    const today = new Date();
    const dateString = date.toISOString().split('T')[0];
    
    // Clases según el estado del día
    if (date.getMonth() !== currentMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }
    
    if (date < today) {
        dayElement.classList.add('past');
        dayElement.style.cursor = 'not-allowed';
        return dayElement;
    }
    
    // Verificar si es domingo (cerrado)
    if (date.getDay() === 0) {
        dayElement.classList.add('closed');
        dayElement.style.cursor = 'not-allowed';
        return dayElement;
    }
    
    // Verificar disponibilidad
    if (occupiedSlots[dateString] && occupiedSlots[dateString].length >= getMaxSlotsForDay(date.getDay())) {
        dayElement.classList.add('occupied');
        dayElement.style.cursor = 'not-allowed';
    } else {
        dayElement.classList.add('available');
        dayElement.addEventListener('click', () => selectModalDate(date));
    }
    
    return dayElement;
}

// Función para seleccionar fecha en el modal
function selectModalDate(date) {
    modalSelectedDate = date;
    
    // Actualizar selección visual
    document.querySelectorAll('.modal-calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Actualizar display de fecha seleccionada
    document.getElementById('modalSelectedDate').textContent = formatDateDisplay(date);
}

// Función para mostrar horarios disponibles en el modal
function showModalTimeSlots() {
    if (!modalSelectedDate) return;
    
    const dateString = modalSelectedDate.toISOString().split('T')[0];
    const dayOfWeek = getDayOfWeek(modalSelectedDate.getDay());
    const timeSlots = generateSlotsForDay(dayOfWeek, dateString);
    
    const timeSlotsContainer = document.getElementById('modalTimeSlots');
    timeSlotsContainer.innerHTML = '';
    
    timeSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'modal-time-slot';
        slotElement.textContent = slot.time;
        
        if (slot.occupied) {
            slotElement.classList.add('occupied');
        } else {
            slotElement.addEventListener('click', () => selectModalTimeSlot(slot.time, slotElement));
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

// Función para seleccionar horario en el modal
function selectModalTimeSlot(time, element) {
    modalSelectedTime = time;
    
    // Actualizar selección visual
    document.querySelectorAll('.modal-time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    element.classList.add('selected');
}

// Función para actualizar el resumen en el modal
function updateModalSummary() {
    if (!modalSelectedService || !modalSelectedDate || !modalSelectedTime) return;
    
    document.getElementById('modalSummaryService').textContent = modalSelectedService.name;
    document.getElementById('modalSummaryDate').textContent = formatDateDisplay(modalSelectedDate);
    document.getElementById('modalSummaryTime').textContent = modalSelectedTime;
    document.getElementById('modalSummaryDuration').textContent = modalSelectedService.duration;
    document.getElementById('modalSummaryPrice').textContent = modalSelectedService.price;
}

// Función para confirmar la cita del modal
function confirmModalAppointment() {
    const form = document.getElementById('modalAppointmentForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const appointment = {
        id: Date.now(),
        service: modalSelectedService,
        date: modalSelectedDate.toISOString().split('T')[0],
        time: modalSelectedTime,
        client: {
            name: formData.get('modalClientName'),
            phone: formData.get('modalClientPhone'),
            notes: formData.get('modalNotes') || ''
        },
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    
    // Guardar cita
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Enviar confirmación por WhatsApp
    sendAppointmentConfirmation(appointment);
    
    // Mostrar mensaje de éxito
    showNotification('¡Cita agendada exitosamente! Te enviaremos una confirmación por WhatsApp.', 'success');
    
    // Cerrar modal
    closeModal('bookingModal');
    
    // Actualizar display de citas
    loadAppointments();
}

// Función para abrir el modal con un servicio preseleccionado
function openBookingModalWithService(serviceId, serviceName, price, duration) {
    openBookingModal();
    selectModalService(serviceId, serviceName, price, duration);
}

// Función para mostrar formulario de registro
function showRegisterForm() {
    isRegisterMode = true;
    
    // Actualizar botones
    document.getElementById('registerToggle').classList.add('active');
    document.getElementById('loginToggle').classList.remove('active');
    
    // Mostrar campos adicionales
    document.getElementById('registerFields').style.display = 'block';
    document.getElementById('benefitsSection').style.display = 'block';
    
    // Actualizar textos
    document.getElementById('welcomeTitle').textContent = '¡Bienvenida a Sbsofinails!';
    document.getElementById('welcomeText').textContent = 'Ingresa tus datos para acceder a tu perfil y disfrutar de nuestro programa de fidelidad';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-user-plus"></i> Crear Mi Perfil';
    
    // Hacer campos requeridos
    document.getElementById('loginName').required = true;
    document.getElementById('acceptTerms').required = true;
}

// Función para mostrar formulario de inicio de sesión
function showLoginForm() {
    isRegisterMode = false;
    
    // Actualizar botones
    document.getElementById('loginToggle').classList.add('active');
    document.getElementById('registerToggle').classList.remove('active');
    
    // Ocultar campos adicionales
    document.getElementById('registerFields').style.display = 'none';
    document.getElementById('benefitsSection').style.display = 'none';
    
    // Actualizar textos
    document.getElementById('welcomeTitle').textContent = '¡Bienvenida de vuelta!';
    document.getElementById('welcomeText').textContent = 'Ingresa tu número de WhatsApp para acceder a tu cuenta';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    
    // Quitar requerimientos
    document.getElementById('loginName').required = false;
    document.getElementById('acceptTerms').required = false;
}

// Funciones para manejar modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
        
        // Si es el modal de login, verificar si el usuario ya está registrado
        if (modalId === 'loginModal') {
            checkUserStatus();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll
    }
}

// Función para cerrar sesión
function logout() {
    // Confirmar antes de cerrar sesión
    if (confirm('¿Estás segura de que quieres cerrar sesión?')) {
        // Limpiar datos del usuario (pero mantener historial)
        localStorage.removeItem('userData');
        
        // Actualizar botón de cuenta
        updateAccountButton();
        
        // Mostrar notificación
        showNotification('Sesión cerrada correctamente', 'info');
        
        // Cerrar modal
        closeModal('loginModal');
        
        // Resetear formulario
        document.getElementById('loginForm').reset();
    }
}

// Función para editar perfil
function editProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData) {
        // Llenar el formulario con datos actuales
        document.getElementById('loginPhone').value = userData.phone || '';
        document.getElementById('loginName').value = userData.name || '';
        document.getElementById('loginBirthday').value = userData.birthday || '';
        
        // Cambiar a modo edición
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('userDashboard').style.display = 'none';
        
        // Cambiar texto del botón
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Perfil';
        
        // Cambiar título del modal
        document.getElementById('accountModalTitle').textContent = 'Editar Perfil';
        document.getElementById('accountModalSubtitle').textContent = 'Actualiza tu información personal';
    }
}

// Función para mostrar secciones del dashboard
function showSection(section) {
    switch(section) {
        case 'appointments':
            // Cerrar modal y ir a sección de agendar
            closeModal('loginModal');
            document.querySelector('a[href="#agendar"]').click();
            break;
        case 'payments':
            // Abrir modal de pagos
            closeModal('loginModal');
            setTimeout(() => openModal('paymentModal'), 300);
            break;
        case 'rewards':
            // Cerrar modal y ir a sección de recompensas
            closeModal('loginModal');
            document.querySelector('a[href="#recompensas"]').click();
            break;
        case 'notifications':
            showNotification('Función de notificaciones próximamente disponible', 'info');
            break;
    }
}

// Actualizar la función checkUserStatus para manejar mejor los estados
function checkUserStatus() {
    const userData = localStorage.getItem('userData');
    const loginSection = document.getElementById('loginSection');
    const userDashboard = document.getElementById('userDashboard');
    
    if (userData) {
        // Usuario ya registrado - mostrar dashboard
        const user = JSON.parse(userData);
        showUserDashboard(user);
        loginSection.style.display = 'none';
        userDashboard.style.display = 'block';
        
        // Actualizar título del modal
        document.getElementById('accountModalTitle').textContent = 'Mi Cuenta';
        document.getElementById('accountModalSubtitle').textContent = `Bienvenida de vuelta, ${user.name}`;
    } else {
        // Usuario nuevo o no logueado - mostrar formulario de registro por defecto
        loginSection.style.display = 'block';
        userDashboard.style.display = 'none';
        showRegisterForm(); // Por defecto, mostrar el formulario de registro
    }
}

// Mejorar la función showUserDashboard
function showUserDashboard(user) {
    // Información básica
    document.getElementById('dashboardUserName').textContent = `¡Hola, ${user.name}!`;
    document.getElementById('dashboardPoints').textContent = userPoints;
    document.getElementById('totalVisits').textContent = visitCount;
    document.getElementById('dashboardUserLevel').textContent = getLoyaltyLevel();
    
    // Calcular total gastado
    const totalSpent = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('totalSpent').textContent = `$${totalSpent.toLocaleString()}`;
    
    // Calcular recompensas obtenidas (ejemplo)
    const rewardsEarned = Math.floor(userPoints / 100);
    document.getElementById('rewardsEarned').textContent = rewardsEarned;
    
    // Actualizar barra de progreso
    updateLoyaltyProgress();
}

// Función para actualizar la barra de progreso de fidelidad
function updateLoyaltyProgress() {
    const currentLevel = getLoyaltyLevel();
    let nextLevelPoints = 0;
    let progressPercent = 0;
    
    if (userPoints < 100) {
        nextLevelPoints = 100 - userPoints;
        progressPercent = (userPoints / 100) * 100;
    } else if (userPoints < 300) {
        nextLevelPoints = 300 - userPoints;
        progressPercent = ((userPoints - 100) / 200) * 100;
    } else if (userPoints < 500) {
        nextLevelPoints = 500 - userPoints;
        progressPercent = ((userPoints - 300) / 200) * 100;
    } else {
        nextLevelPoints = 0;
        progressPercent = 100;
    }
    
    document.getElementById('loyaltyProgress').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = 
        nextLevelPoints > 0 ? `${nextLevelPoints} puntos para el próximo nivel` : '¡Nivel máximo alcanzado!';
}

// Actualizar el manejo del formulario
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    
    if (isRegisterMode) {
        // Modo registro - crear nueva cuenta
        const formData = {
            phone: phone,
            name: document.getElementById('loginName').value,

            birthday: document.getElementById('loginBirthday').value,
            createdAt: new Date().toISOString()
        };
        
        // Guardar datos del usuario
        localStorage.setItem('userData', JSON.stringify(formData));
        localStorage.setItem('userPhone', formData.phone);
        
        showNotification('¡Perfil creado exitosamente! Bienvenida a Sbsofinails', 'success');
    } else {
        // Modo login - buscar cuenta existente
        const existingUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const user = existingUsers.find(u => u.phone === phone);
        
        if (user) {
            // Usuario encontrado
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('userPhone', user.phone);
            showNotification(`¡Bienvenida de vuelta, ${user.name}!`, 'success');
        } else {
            // Usuario no encontrado
            showNotification('No encontramos una cuenta con ese número. ¿Quieres crear una cuenta nueva?', 'warning');
            showRegisterForm(); // Cambiar a modo registro
            return;
        }
    }
    
    // Actualizar botón de cuenta
    updateAccountButton();
    
    // Cerrar modal
    closeModal('loginModal');
    
    // Limpiar formulario
    document.getElementById('loginForm').reset();
});

// Función para abrir la galería de un servicio
function openServiceGallery(serviceId, serviceName) {
    currentServiceGallery = serviceId;
    currentImageIndex = 0;
    isAnimating = false;
    
    // Obtener las imágenes del servicio
    const serviceData = serviceGalleries[serviceId];
    if (!serviceData) {
        showNotification('No hay imágenes disponibles para este servicio', 'warning');
        return;
    }
    
    galleryImages = serviceData.images;
    
    // Actualizar el título del modal
    document.getElementById('galleryServiceTitle').textContent = `Galería - ${serviceName}`;
    
    // Crear el carrusel 3D
    createCarousel3D();
    
    // Generar indicadores
    generateIndicators();
    
    // Abrir el modal
    openModal('serviceGalleryModal');
}

// Función para crear el carrusel 3D
function createCarousel3D() {
    const galleryMain = document.querySelector('.gallery-main');
    
    // Limpiar contenido anterior
    galleryMain.innerHTML = `
        <div class="carousel-3d" id="carousel3d"></div>
        <div class="gallery-navigation">
            <button class="gallery-nav-btn" id="prevImageBtn" onclick="previousImage()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="gallery-nav-btn" id="nextImageBtn" onclick="nextImage()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="image-info" id="imageInfo">
            <span id="imageCounter">1 / ${galleryImages.length}</span>
        </div>
    `;
    
    carouselContainer = document.getElementById('carousel3d');
    
    // Crear imágenes del carrusel
    galleryImages.forEach((imageSrc, index) => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Imagen ${index + 1}`;
        img.className = 'carousel-image';
        img.onclick = () => goToImage(index);
        
        carouselContainer.appendChild(img);
    });
    
    // Posicionar imágenes inicialmente
    updateCarouselPositions();
}

// Función para actualizar las posiciones del carrusel
function updateCarouselPositions() {
    const images = carouselContainer.querySelectorAll('.carousel-image');
    const totalImages = images.length;
    const angleStep = 360 / totalImages;
    
    images.forEach((img, index) => {
        // Calcular la diferencia de posición respecto a la imagen actual
        let positionDiff = index - currentImageIndex;
        
        // Normalizar la diferencia para que esté entre -totalImages/2 y totalImages/2
        if (positionDiff > totalImages / 2) {
            positionDiff -= totalImages;
        } else if (positionDiff < -totalImages / 2) {
            positionDiff += totalImages;
        }
        
        // Calcular el ángulo y la posición
        const angle = positionDiff * angleStep;
        const radius = 200;
        const x = Math.sin(angle * Math.PI / 180) * radius;
        const z = Math.cos(angle * Math.PI / 180) * radius;
        
        // Aplicar transformaciones
        img.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
        
        // Aplicar clases según la posición
        img.classList.remove('active', 'side', 'back');
        
        if (index === currentImageIndex) {
            img.classList.add('active');
        } else if (Math.abs(positionDiff) === 1) {
            img.classList.add('side');
        } else {
            img.classList.add('back');
        }
    });
    
    // Actualizar contador
    document.getElementById('imageCounter').textContent = `${currentImageIndex + 1} / ${totalImages}`;
    
    // Actualizar indicadores
    updateIndicators();
}

// Función para generar indicadores
function generateIndicators() {
    const galleryContainer = document.querySelector('.gallery-container');
    
    // Remover indicadores existentes
    const existingIndicators = galleryContainer.querySelector('.gallery-indicators');
    if (existingIndicators) {
        existingIndicators.remove();
    }
    
    // Crear nuevos indicadores
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'gallery-indicators';
    
    galleryImages.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'indicator-dot';
        dot.onclick = () => goToImage(index);
        
        if (index === currentImageIndex) {
            dot.classList.add('active');
        }
        
        indicatorsContainer.appendChild(dot);
    });
    
    // Insertar antes de las acciones
    const galleryActions = galleryContainer.querySelector('.gallery-actions');
    galleryContainer.insertBefore(indicatorsContainer, galleryActions);
}

// Función para actualizar indicadores
function updateIndicators() {
    const indicators = document.querySelectorAll('.indicator-dot');
    indicators.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex);
    });
}

// Función para ir a una imagen específica
function goToImage(index) {
    if (isAnimating || index === currentImageIndex) return;
    
    isAnimating = true;
    currentImageIndex = index;
    
    updateCarouselPositions();
    
    // Permitir nueva animación después de un tiempo
    setTimeout(() => {
        isAnimating = false;
    }, 800);
}

// Función para imagen anterior
function previousImage() {
    if (isAnimating) return;
    
    const newIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1;
    goToImage(newIndex);
}

// Función para imagen siguiente
function nextImage() {
    if (isAnimating) return;
    
    const newIndex = currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1;
    goToImage(newIndex);
}

// Función para agendar servicio desde la galería
function bookServiceFromGallery() {
    if (!currentServiceGallery) return;
    
    // Cerrar modal de galería
    closeModal('serviceGalleryModal');
    
    // Mapear servicios a los datos del modal de reserva
    const serviceMapping = {
        'semipermanente': { id: 'manicura-clasica', name: 'Semipermanente', price: 13000, duration: 40 },
        'capping-gel': { id: 'manicura-gel', name: 'Capping Gel', price: 15000, duration: 90 },
        'soft-gel': { id: 'pedicura', name: 'Soft Gel', price: 17000, duration: 90 },
        'capping-polygel': { id: 'unas-acrilicas', name: 'Capping Polygel', price: 45000, duration: 120 },
        'retiro': { id: 'nail-art', name: 'Retiro', price: 6000, duration: 20 },
        'belleza-pies': { id: 'tratamiento-cuticular', name: 'Belleza de Pies', price: 14000, duration: 40 }
    };
    
    const serviceData = serviceMapping[currentServiceGallery];
    if (serviceData) {
        // Abrir modal de reserva con el servicio seleccionado
        openBookingModalWithService(serviceData.id, serviceData.name, serviceData.price, serviceData.duration);
    }
}

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(inputId + 'ToggleIcon');
    
    if (!passwordInput || !toggleIcon) {
        console.error('No se encontró el campo de contraseña o el icono');
        return;
    }
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Auto-rotación del carrusel (opcional)
let autoRotateInterval = null;

function startAutoRotate() {
    autoRotateInterval = setInterval(() => {
        if (!isAnimating) {
            nextImage();
        }
    }, 4000);
}

function stopAutoRotate() {
    if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
    }
}

// Event listeners para navegación con teclado y control de auto-rotación
document.addEventListener('keydown', function(e) {
    const galleryModal = document.getElementById('serviceGalleryModal');
    if (galleryModal && galleryModal.style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            previousImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'Escape') {
            closeModal('serviceGalleryModal');
        }
    }
});

// Pausar auto-rotación cuando el mouse está sobre la galería
document.addEventListener('DOMContentLoaded', function() {
    const galleryModal = document.getElementById('serviceGalleryModal');
    if (galleryModal) {
        galleryModal.addEventListener('mouseenter', stopAutoRotate);
        galleryModal.addEventListener('mouseleave', startAutoRotate);
    }
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});