// Sistema de Notificaciones WhatsApp - Sofí Nail

// Configuración de notificaciones
const NOTIFICATION_TYPES = {
    APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
    LOYALTY_UPDATE: 'loyalty_update',
    PROMOTION: 'promotion',
    BIRTHDAY: 'birthday'
};

// Plantillas de mensajes
const MESSAGE_TEMPLATES = {
    [NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION]: (data) => `
¡Hola ${data.name}! 👋

Tu cita en Sofí Nail ha sido confirmada:

📅 Fecha: ${formatDate(data.date)}
⏰ Hora: ${data.time}
💅 Servicio: ${data.service}
💰 Precio: $${data.price}

📍 Dirección: [Tu dirección aquí]

¡Te esperamos! Si necesitas reprogramar, contáctanos con 24hs de anticipación.

Sofí Nail - El cuidado de tus uñas 💖
    `.trim(),

    [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: (data) => `
¡Hola ${data.name}! 👋

Te recordamos tu cita de mañana en Sofí Nail:

📅 Fecha: ${formatDate(data.date)}
⏰ Hora: ${data.time}
💅 Servicio: ${data.service}

💡 Consejos para tu cita:
• Llega 5 minutos antes
• Trae las uñas limpias
• Si tienes alguna alergia, avísanos

¡Nos vemos mañana! 💖

Sofí Nail - El cuidado de tus uñas
    `.trim(),

    [NOTIFICATION_TYPES.PAYMENT_CONFIRMATION]: (data) => `
✅ Pago confirmado en Sofí Nail

💰 Monto: $${data.amount}
📋 Servicio: ${data.service}
📅 Fecha: ${formatDate(data.date)}
💳 Método: ${data.method}

🎉 ¡Has ganado ${data.pointsEarned} puntos de fidelidad!
⭐ Puntos totales: ${data.totalPoints}

¡Gracias por elegirnos! 💖

Sofí Nail - El cuidado de tus uñas
    `.trim(),

    [NOTIFICATION_TYPES.LOYALTY_UPDATE]: (data) => `
🎉 ¡Felicitaciones ${data.name}!

Has alcanzado el nivel ${data.newLevel} en nuestro programa de fidelidad!

⭐ Puntos actuales: ${data.points}
🏆 Nivel: ${data.newLevel}
🎁 Nuevos beneficios desbloqueados:

${data.benefits.map(benefit => `• ${benefit}`).join('\n')}

¡Sigue acumulando puntos para más recompensas!

Sofí Nail - El cuidado de tus uñas 💖
    `.trim(),

    [NOTIFICATION_TYPES.PROMOTION]: (data) => `
🎉 ¡Oferta especial para ti!

${data.title}

${data.description}

⏰ Válida hasta: ${formatDate(data.validUntil)}
💅 Servicios incluidos: ${data.services.join(', ')}

¡Agenda tu cita ahora y aprovecha esta promoción!

Sofí Nail - El cuidado de tus uñas 💖
    `.trim(),

    [NOTIFICATION_TYPES.BIRTHDAY]: (data) => `
🎂 ¡Feliz cumpleaños ${data.name}! 🎉

En tu día especial, queremos regalarte:

🎁 20% de descuento en cualquier servicio
💅 Válido durante todo el mes de tu cumpleaños
⭐ Puntos dobles en tu próxima visita

¡Ven a celebrar con nosotras y consiente tus uñas!

Sofí Nail - El cuidado de tus uñas 💖
    `.trim()
};

// Configuración de usuario para notificaciones
let notificationSettings = {
    appointmentConfirmation: true,
    appointmentReminder: true,
    paymentConfirmation: true,
    loyaltyUpdates: true,
    promotions: false,
    birthday: true
};

// Inicializar sistema de notificaciones
function initializeNotificationSystem() {
    loadNotificationSettings();
    setupNotificationEventListeners();
    loadNotificationHistory();
    scheduleAutomaticReminders();
}

// Cargar configuración de notificaciones
function loadNotificationSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
        notificationSettings = { ...notificationSettings, ...JSON.parse(savedSettings) };
    }
    
    updateNotificationToggles();
}

// Actualizar toggles en la interfaz
function updateNotificationToggles() {
    Object.keys(notificationSettings).forEach(setting => {
        const toggle = document.getElementById(`toggle-${setting}`);
        if (toggle) {
            toggle.checked = notificationSettings[setting];
        }
    });
}

// Configurar event listeners
function setupNotificationEventListeners() {
    // Toggles de configuración
    Object.keys(notificationSettings).forEach(setting => {
        const toggle = document.getElementById(`toggle-${setting}`);
        if (toggle) {
            toggle.addEventListener('change', function() {
                notificationSettings[setting] = this.checked;
                saveNotificationSettings();
                showNotification('Configuración actualizada', 'success');
            });
        }
    });

    // Botón de mensaje de prueba
    const testBtn = document.getElementById('test-notification');
    if (testBtn) {
        testBtn.addEventListener('click', sendTestNotification);
    }

    // Configuración de teléfono
    const phoneForm = document.getElementById('phone-config-form');
    if (phoneForm) {
        phoneForm.addEventListener('submit', handlePhoneConfiguration);
    }
}

// Guardar configuración de notificaciones
function saveNotificationSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

// Enviar notificación
function sendNotification(type, data, phoneNumber = null) {
    // Verificar si el tipo de notificación está habilitado
    const settingKey = getSettingKeyFromType(type);
    if (settingKey && !notificationSettings[settingKey]) {
        console.log(`Notificación ${type} deshabilitada por el usuario`);
        return;
    }

    const phone = phoneNumber || localStorage.getItem('userPhone');
    if (!phone) {
        console.log('No hay número de teléfono configurado');
        return;
    }

    const template = MESSAGE_TEMPLATES[type];
    if (!template) {
        console.error(`Plantilla no encontrada para el tipo: ${type}`);
        return;
    }

    const message = template(data);
    
    // Registrar la notificación
    logNotification(type, data, message);
    
    // Enviar por WhatsApp
    sendWhatsAppMessage(message, phone);
}

// Obtener clave de configuración desde tipo de notificación
function getSettingKeyFromType(type) {
    const mapping = {
        [NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION]: 'appointmentConfirmation',
        [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: 'appointmentReminder',
        [NOTIFICATION_TYPES.PAYMENT_CONFIRMATION]: 'paymentConfirmation',
        [NOTIFICATION_TYPES.LOYALTY_UPDATE]: 'loyaltyUpdates',
        [NOTIFICATION_TYPES.PROMOTION]: 'promotions',
        [NOTIFICATION_TYPES.BIRTHDAY]: 'birthday'
    };
    return mapping[type];
}

// Registrar notificación en el historial
function logNotification(type, data, message) {
    const notification = {
        id: Date.now(),
        type: type,
        data: data,
        message: message,
        timestamp: new Date().toISOString(),
        status: 'sent'
    };

    let history = JSON.parse(localStorage.getItem('notificationHistory')) || [];
    history.unshift(notification);
    
    // Mantener solo los últimos 50 registros
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    localStorage.setItem('notificationHistory', JSON.stringify(history));
    loadNotificationHistory();
}

// Cargar historial de notificaciones
function loadNotificationHistory() {
    const historyContainer = document.getElementById('notification-history');
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem('notificationHistory')) || [];
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No hay notificaciones enviadas</p>
                <small>El historial aparecerá aquí cuando envíes notificaciones</small>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = `
        <div class="history-list">
            ${history.map(notification => `
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <h4>${getNotificationTitle(notification.type)}</h4>
                        <p class="notification-preview">${notification.message.substring(0, 100)}...</p>
                        <small class="notification-time">${formatDateTime(notification.timestamp)}</small>
                    </div>
                    <div class="notification-status ${notification.status}">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Obtener icono para tipo de notificación
function getNotificationIcon(type) {
    const icons = {
        [NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION]: 'fas fa-calendar-check',
        [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: 'fas fa-clock',
        [NOTIFICATION_TYPES.PAYMENT_CONFIRMATION]: 'fas fa-credit-card',
        [NOTIFICATION_TYPES.LOYALTY_UPDATE]: 'fas fa-star',
        [NOTIFICATION_TYPES.PROMOTION]: 'fas fa-gift',
        [NOTIFICATION_TYPES.BIRTHDAY]: 'fas fa-birthday-cake'
    };
    return icons[type] || 'fas fa-bell';
}

// Obtener título para tipo de notificación
function getNotificationTitle(type) {
    const titles = {
        [NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION]: 'Confirmación de Cita',
        [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: 'Recordatorio de Cita',
        [NOTIFICATION_TYPES.PAYMENT_CONFIRMATION]: 'Confirmación de Pago',
        [NOTIFICATION_TYPES.LOYALTY_UPDATE]: 'Actualización de Fidelidad',
        [NOTIFICATION_TYPES.PROMOTION]: 'Promoción Especial',
        [NOTIFICATION_TYPES.BIRTHDAY]: 'Feliz Cumpleaños'
    };
    return titles[type] || 'Notificación';
}

// Enviar mensaje de prueba
function sendTestNotification() {
    const phone = localStorage.getItem('userPhone');
    if (!phone) {
        showNotification('Configura tu número de teléfono primero', 'error');
        return;
    }

    const testData = {
        name: 'Cliente de Prueba',
        service: 'Manicura con Gel',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
        time: '15:00',
        price: 35
    };

    sendNotification(NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION, testData);
    showNotification('Mensaje de prueba enviado', 'success');
}

// Manejar configuración de teléfono
function handlePhoneConfiguration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const phone = formData.get('phone');
    const name = formData.get('name') || 'Cliente';
    
    if (!phone) {
        showNotification('Por favor ingresa un número de teléfono', 'error');
        return;
    }

    localStorage.setItem('userPhone', phone);
    localStorage.setItem('userName', name);
    
    showNotification('Configuración guardada correctamente', 'success');
    
    // Enviar mensaje de bienvenida
    const welcomeMessage = `¡Hola ${name}! 👋

Bienvenido/a al sistema de notificaciones de Sofí Nail.

Tu número ha sido configurado correctamente para recibir:
• Confirmaciones de citas
• Recordatorios importantes
• Confirmaciones de pago
• Actualizaciones de puntos

¡Gracias por elegirnos! 💖

Sofí Nail - El cuidado de tus uñas`;

    sendWhatsAppMessage(welcomeMessage, phone);
}

// Programar recordatorios automáticos
function scheduleAutomaticReminders() {
    // Verificar citas para mañana cada hora
    setInterval(checkUpcomingAppointments, 60 * 60 * 1000);
    
    // Verificar cumpleaños cada día
    setInterval(checkBirthdays, 24 * 60 * 60 * 1000);
}

// Verificar citas próximas
function checkUpcomingAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    appointments.forEach(appointment => {
        if (appointment.date === tomorrowStr && appointment.status === 'confirmada') {
            // Verificar si ya se envió el recordatorio
            const reminderKey = `reminder_${appointment.id}`;
            if (!localStorage.getItem(reminderKey)) {
                sendNotification(NOTIFICATION_TYPES.APPOINTMENT_REMINDER, appointment);
                localStorage.setItem(reminderKey, 'sent');
            }
        }
    });
}

// Verificar cumpleaños
function checkBirthdays() {
    const userBirthday = localStorage.getItem('userBirthday');
    if (!userBirthday) return;

    const today = new Date();
    const birthday = new Date(userBirthday);
    
    if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        const birthdayKey = `birthday_${today.getFullYear()}`;
        if (!localStorage.getItem(birthdayKey)) {
            const userName = localStorage.getItem('userName') || 'Cliente';
            sendNotification(NOTIFICATION_TYPES.BIRTHDAY, { name: userName });
            localStorage.setItem(birthdayKey, 'sent');
        }
    }
}

// Enviar promoción especial
function sendPromotion(promotionData) {
    if (notificationSettings.promotions) {
        sendNotification(NOTIFICATION_TYPES.PROMOTION, promotionData);
    }
}

// Funciones de utilidad exportadas para usar en otros archivos
window.NotificationSystem = {
    sendNotification,
    NOTIFICATION_TYPES,
    sendPromotion,
    initializeNotificationSystem
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeNotificationSystem);