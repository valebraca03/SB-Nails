// Sistema de Pagos y Finanzas - Sofí Nail

// Configuración de servicios y precios
const SERVICES_CONFIG = {
    'manicura-clasica': {
        name: 'Manicura Clásica',
        price: 25,
        duration: 45,
        description: 'Limado, cutícula y esmaltado tradicional',
        category: 'manicura'
    },
    'manicura-gel': {
        name: 'Manicura con Gel',
        price: 35,
        duration: 60,
        description: 'Manicura completa con esmaltado en gel',
        category: 'manicura'
    },
    'unas-acrilicas': {
        name: 'Uñas Acrílicas',
        price: 45,
        duration: 90,
        description: 'Extensión y decoración con acrílico',
        category: 'extension'
    },
    'pedicura-completa': {
        name: 'Pedicura Completa',
        price: 30,
        duration: 50,
        description: 'Pedicura con exfoliación y esmaltado',
        category: 'pedicura'
    },
    'nail-art': {
        name: 'Nail Art',
        price: 15,
        duration: 30,
        description: 'Diseños artísticos personalizados',
        category: 'decoracion'
    },
    'mantenimiento': {
        name: 'Mantenimiento',
        price: 20,
        duration: 30,
        description: 'Retoque y mantenimiento de uñas',
        category: 'mantenimiento'
    }
};

// Métodos de pago disponibles
const PAYMENT_METHODS = {
    'efectivo': {
        name: 'Efectivo',
        icon: 'fas fa-money-bill-wave',
        description: 'Pago en efectivo al momento del servicio'
    },
    'tarjeta': {
        name: 'Tarjeta de Débito/Crédito',
        icon: 'fas fa-credit-card',
        description: 'Pago con tarjeta'
    },
    'transferencia': {
        name: 'Transferencia Bancaria',
        icon: 'fas fa-university',
        description: 'Transferencia a cuenta bancaria'
    },
    'mercadopago': {
        name: 'MercadoPago',
        icon: 'fas fa-mobile-alt',
        description: 'Pago digital con MercadoPago'
    }
};

// Inicializar sistema de pagos
function initializePaymentSystem() {
    loadPaymentHistory();
    loadPaymentStats();
    setupPaymentEventListeners();
    loadServicesPricing();
}

// Configurar event listeners para pagos
function setupPaymentEventListeners() {
    // Formulario de nuevo pago
    const paymentForm = document.getElementById('new-payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handleNewPayment);
    }

    // Calculadora de servicios
    const serviceSelectors = document.querySelectorAll('.service-selector');
    serviceSelectors.forEach(selector => {
        selector.addEventListener('change', updatePaymentCalculator);
    });

    // Botones de método de pago
    const methodButtons = document.querySelectorAll('.payment-method-btn');
    methodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.method);
        });
    });

    // Filtros de historial
    const filterButtons = document.querySelectorAll('.payment-filter');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterPaymentHistory(this.dataset.filter);
        });
    });
}

// Manejar nuevo pago
function handleNewPayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedServices = Array.from(document.querySelectorAll('.service-selector:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedServices.length === 0) {
        showNotification('Selecciona al menos un servicio', 'error');
        return;
    }

    const totalAmount = calculateTotal(selectedServices);
    const payment = {
        id: Date.now(),
        services: selectedServices.map(serviceId => ({
            id: serviceId,
            name: SERVICES_CONFIG[serviceId].name,
            price: SERVICES_CONFIG[serviceId].price
        })),
        totalAmount: totalAmount,
        method: formData.get('payment-method'),
        customerName: formData.get('customer-name') || 'Cliente',
        customerPhone: formData.get('customer-phone') || '',
        notes: formData.get('notes') || '',
        date: new Date().toISOString(),
        status: 'completado'
    };

    // Guardar pago
    savePayment(payment);
    
    // Agregar puntos si es un cliente registrado
    if (payment.customerPhone) {
        const pointsEarned = Math.floor(totalAmount / 10);
        addPoints(pointsEarned, `Pago de $${totalAmount}`);
        
        // Enviar confirmación por WhatsApp
        sendPaymentNotification(payment, pointsEarned);
    }

    showNotification(`Pago de $${totalAmount} registrado exitosamente`, 'success');
    e.target.reset();
    loadPaymentHistory();
    loadPaymentStats();
}

// Calcular total de servicios seleccionados
function calculateTotal(serviceIds) {
    return serviceIds.reduce((total, serviceId) => {
        return total + (SERVICES_CONFIG[serviceId]?.price || 0);
    }, 0);
}

// Actualizar calculadora de pagos
function updatePaymentCalculator() {
    const selectedServices = Array.from(document.querySelectorAll('.service-selector:checked'));
    const totalElement = document.getElementById('payment-total');
    const detailsElement = document.getElementById('payment-details');
    
    if (!totalElement) return;

    let total = 0;
    let details = [];

    selectedServices.forEach(checkbox => {
        const serviceId = checkbox.value;
        const service = SERVICES_CONFIG[serviceId];
        if (service) {
            total += service.price;
            details.push(`${service.name}: $${service.price}`);
        }
    });

    totalElement.textContent = `$${total}`;
    
    if (detailsElement) {
        detailsElement.innerHTML = details.length > 0 ? 
            details.map(detail => `<div class="service-detail">${detail}</div>`).join('') :
            '<div class="no-services">No hay servicios seleccionados</div>';
    }

    // Calcular puntos que se ganarían
    const pointsElement = document.getElementById('points-to-earn');
    if (pointsElement) {
        const points = Math.floor(total / 10);
        pointsElement.textContent = `+${points} puntos`;
    }
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
    // Remover selección anterior
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Seleccionar nuevo método
    const selectedBtn = document.querySelector(`[data-method="${method}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // Actualizar campo oculto
    const methodInput = document.getElementById('selected-payment-method');
    if (methodInput) {
        methodInput.value = method;
    }
    
    // Mostrar información específica del método
    showPaymentMethodInfo(method);
}

// Mostrar información del método de pago
function showPaymentMethodInfo(method) {
    const infoContainer = document.getElementById('payment-method-info');
    if (!infoContainer) return;
    
    const methodConfig = PAYMENT_METHODS[method];
    if (!methodConfig) return;
    
    let infoHTML = `
        <div class="method-info">
            <i class="${methodConfig.icon}"></i>
            <div>
                <h4>${methodConfig.name}</h4>
                <p>${methodConfig.description}</p>
            </div>
        </div>
    `;
    
    // Agregar información específica según el método
    switch (method) {
        case 'transferencia':
            infoHTML += `
                <div class="bank-info">
                    <h5>Datos para transferencia:</h5>
                    <p><strong>Banco:</strong> [Tu banco]</p>
                    <p><strong>CBU:</strong> [Tu CBU]</p>
                    <p><strong>Alias:</strong> [Tu alias]</p>
                </div>
            `;
            break;
        case 'mercadopago':
            infoHTML += `
                <div class="mp-info">
                    <h5>MercadoPago:</h5>
                    <p><strong>CVU:</strong> [Tu CVU]</p>
                    <p><strong>Alias:</strong> [Tu alias MP]</p>
                </div>
            `;
            break;
    }
    
    infoContainer.innerHTML = infoHTML;
}

// Guardar pago en localStorage
function savePayment(payment) {
    let payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    payments.unshift(payment);
    
    // Mantener solo los últimos 100 pagos
    if (payments.length > 100) {
        payments = payments.slice(0, 100);
    }
    
    localStorage.setItem('paymentHistory', JSON.stringify(payments));
}

// Cargar historial de pagos
function loadPaymentHistory() {
    const historyContainer = document.getElementById('payment-history-list');
    if (!historyContainer) return;
    
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    
    if (payments.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No hay pagos registrados</p>
                <small>Los pagos aparecerán aquí cuando se registren</small>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = payments.map(payment => `
        <div class="payment-history-item">
            <div class="payment-header">
                <div class="payment-amount">$${payment.totalAmount}</div>
                <div class="payment-date">${formatDate(payment.date)}</div>
            </div>
            <div class="payment-details">
                <div class="services-list">
                    ${payment.services.map(service => 
                        `<span class="service-tag">${service.name}</span>`
                    ).join('')}
                </div>
                <div class="payment-info">
                    <span class="payment-method">
                        <i class="${PAYMENT_METHODS[payment.method]?.icon || 'fas fa-credit-card'}"></i>
                        ${PAYMENT_METHODS[payment.method]?.name || payment.method}
                    </span>
                    <span class="customer-name">${payment.customerName}</span>
                </div>
            </div>
            ${payment.notes ? `<div class="payment-notes">${payment.notes}</div>` : ''}
            <div class="payment-actions">
                <button onclick="viewPaymentDetails(${payment.id})" class="btn-view">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
                <button onclick="duplicatePayment(${payment.id})" class="btn-duplicate">
                    <i class="fas fa-copy"></i> Duplicar
                </button>
            </div>
        </div>
    `).join('');
}

// Cargar estadísticas de pagos
function loadPaymentStats() {
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    
    // Estadísticas generales
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    const totalPayments = payments.length;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    
    // Estadísticas del mes actual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    
    // Método de pago más usado
    const methodCounts = {};
    payments.forEach(payment => {
        methodCounts[payment.method] = (methodCounts[payment.method] || 0) + 1;
    });
    
    const mostUsedMethod = Object.keys(methodCounts).reduce((a, b) => 
        methodCounts[a] > methodCounts[b] ? a : b, 'efectivo'
    );
    
    // Actualizar elementos en la interfaz
    updateStatElement('total-revenue', `$${totalRevenue.toFixed(2)}`);
    updateStatElement('total-payments', totalPayments);
    updateStatElement('average-payment', `$${averagePayment.toFixed(2)}`);
    updateStatElement('monthly-revenue', `$${monthlyRevenue.toFixed(2)}`);
    updateStatElement('monthly-payments', monthlyPayments.length);
    updateStatElement('most-used-method', PAYMENT_METHODS[mostUsedMethod]?.name || mostUsedMethod);
}

// Actualizar elemento de estadística
function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Cargar precios de servicios
function loadServicesPricing() {
    const servicesContainer = document.getElementById('services-pricing');
    if (!servicesContainer) return;
    
    const servicesByCategory = {};
    
    // Agrupar servicios por categoría
    Object.entries(SERVICES_CONFIG).forEach(([id, service]) => {
        if (!servicesByCategory[service.category]) {
            servicesByCategory[service.category] = [];
        }
        servicesByCategory[service.category].push({ id, ...service });
    });
    
    // Generar HTML
    servicesContainer.innerHTML = Object.entries(servicesByCategory).map(([category, services]) => `
        <div class="service-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div class="services-grid">
                ${services.map(service => `
                    <div class="service-card">
                        <div class="service-header">
                            <h4>${service.name}</h4>
                            <div class="service-price">$${service.price}</div>
                        </div>
                        <p class="service-description">${service.description}</p>
                        <div class="service-duration">
                            <i class="fas fa-clock"></i>
                            ${service.duration} min
                        </div>
                        <label class="service-checkbox">
                            <input type="checkbox" class="service-selector" value="${service.id}">
                            <span class="checkmark"></span>
                            Seleccionar
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Reconfigurar event listeners
    document.querySelectorAll('.service-selector').forEach(selector => {
        selector.addEventListener('change', updatePaymentCalculator);
    });
}

// Filtrar historial de pagos
function filterPaymentHistory(filter) {
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    let filteredPayments = payments;
    
    switch (filter) {
        case 'today':
            const today = new Date().toDateString();
            filteredPayments = payments.filter(payment => 
                new Date(payment.date).toDateString() === today
            );
            break;
        case 'week':
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            filteredPayments = payments.filter(payment => 
                new Date(payment.date) >= weekAgo
            );
            break;
        case 'month':
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filteredPayments = payments.filter(payment => 
                new Date(payment.date) >= monthAgo
            );
            break;
        case 'efectivo':
        case 'tarjeta':
        case 'transferencia':
        case 'mercadopago':
            filteredPayments = payments.filter(payment => payment.method === filter);
            break;
    }
    
    // Actualizar botones de filtro
    document.querySelectorAll('.payment-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    // Mostrar resultados filtrados
    displayFilteredPayments(filteredPayments);
}

// Mostrar pagos filtrados
function displayFilteredPayments(payments) {
    const historyContainer = document.getElementById('payment-history-list');
    if (!historyContainer) return;
    
    // Usar la misma lógica que loadPaymentHistory pero con los pagos filtrados
    if (payments.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <p>No hay pagos que coincidan con el filtro</p>
                <button onclick="loadPaymentHistory()" class="btn-clear-filter">
                    Mostrar todos
                </button>
            </div>
        `;
        return;
    }
    
    // Reutilizar la lógica de renderizado de loadPaymentHistory
    historyContainer.innerHTML = payments.map(payment => `
        <div class="payment-history-item">
            <div class="payment-header">
                <div class="payment-amount">$${payment.totalAmount}</div>
                <div class="payment-date">${formatDate(payment.date)}</div>
            </div>
            <div class="payment-details">
                <div class="services-list">
                    ${payment.services.map(service => 
                        `<span class="service-tag">${service.name}</span>`
                    ).join('')}
                </div>
                <div class="payment-info">
                    <span class="payment-method">
                        <i class="${PAYMENT_METHODS[payment.method]?.icon || 'fas fa-credit-card'}"></i>
                        ${PAYMENT_METHODS[payment.method]?.name || payment.method}
                    </span>
                    <span class="customer-name">${payment.customerName}</span>
                </div>
            </div>
            ${payment.notes ? `<div class="payment-notes">${payment.notes}</div>` : ''}
        </div>
    `).join('');
}

// Enviar notificación de pago
function sendPaymentNotification(payment, pointsEarned) {
    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone || !window.NotificationSystem) return;
    
    const notificationData = {
        amount: payment.totalAmount,
        service: payment.services.map(s => s.name).join(', '),
        date: payment.date,
        method: PAYMENT_METHODS[payment.method]?.name || payment.method,
        pointsEarned: pointsEarned,
        totalPoints: parseInt(localStorage.getItem('userPoints')) || 0
    };
    
    window.NotificationSystem.sendNotification(
        window.NotificationSystem.NOTIFICATION_TYPES.PAYMENT_CONFIRMATION,
        notificationData
    );
}

// Ver detalles de pago
function viewPaymentDetails(paymentId) {
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) return;
    
    // Crear modal con detalles
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalles del Pago</h3>
                <button onclick="this.closest('.payment-modal').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="payment-detail-grid">
                    <div class="detail-item">
                        <label>Monto Total:</label>
                        <span>$${payment.totalAmount}</span>
                    </div>
                    <div class="detail-item">
                        <label>Fecha:</label>
                        <span>${formatDateTime(payment.date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Método de Pago:</label>
                        <span>${PAYMENT_METHODS[payment.method]?.name || payment.method}</span>
                    </div>
                    <div class="detail-item">
                        <label>Cliente:</label>
                        <span>${payment.customerName}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Servicios:</label>
                        <div class="services-detail">
                            ${payment.services.map(service => `
                                <div class="service-detail-item">
                                    <span>${service.name}</span>
                                    <span>$${service.price}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${payment.notes ? `
                        <div class="detail-item full-width">
                            <label>Notas:</label>
                            <span>${payment.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Duplicar pago
function duplicatePayment(paymentId) {
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) return;
    
    // Preseleccionar servicios en el formulario
    payment.services.forEach(service => {
        const checkbox = document.querySelector(`input[value="${service.id}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Actualizar calculadora
    updatePaymentCalculator();
    
    // Scroll al formulario
    document.getElementById('new-payment-form')?.scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Servicios preseleccionados para duplicar pago', 'info');
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', initializePaymentSystem);