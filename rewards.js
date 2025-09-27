// Sistema de Recompensas y Fidelidad - Sofí Nail

// Configuración de recompensas disponibles
const REWARDS_CONFIG = [
    {
        id: 1,
        title: '10% de Descuento',
        description: 'En tu próximo servicio',
        pointsRequired: 100,
        icon: 'fas fa-percentage',
        category: 'descuento'
    },
    {
        id: 2,
        title: 'Manicura Gratis',
        description: 'Manicura clásica sin costo',
        pointsRequired: 300,
        icon: 'fas fa-gift',
        category: 'servicio'
    },
    {
        id: 3,
        title: '20% de Descuento',
        description: 'En cualquier servicio',
        pointsRequired: 500,
        icon: 'fas fa-star',
        category: 'descuento'
    },
    {
        id: 4,
        title: 'Servicio Premium Gratis',
        description: 'Uñas acrílicas o gel gratis',
        pointsRequired: 800,
        icon: 'fas fa-crown',
        category: 'servicio'
    },
    {
        id: 5,
        title: 'Pedicura Completa Gratis',
        description: 'Pedicura con esmaltado incluido',
        pointsRequired: 600,
        icon: 'fas fa-spa',
        category: 'servicio'
    },
    {
        id: 6,
        title: '30% de Descuento VIP',
        description: 'Descuento especial en todos los servicios',
        pointsRequired: 1000,
        icon: 'fas fa-diamond',
        category: 'vip'
    }
];

// Configuración de niveles de fidelidad
const LOYALTY_LEVELS = {
    'Nuevo': {
        minVisits: 0,
        color: '#E3F2FD',
        icon: 'fas fa-heart',
        benefits: ['Bienvenida especial', 'Puntos por cada visita']
    },
    'Bronce': {
        minVisits: 5,
        color: '#FFF0E6',
        icon: 'fas fa-medal',
        benefits: ['5% descuento adicional', 'Recordatorios personalizados']
    },
    'Plata': {
        minVisits: 10,
        color: '#F8F9FA',
        icon: 'fas fa-award',
        benefits: ['10% descuento adicional', 'Prioridad en reservas']
    },
    'Oro': {
        minVisits: 15,
        color: '#FFF3CD',
        icon: 'fas fa-trophy',
        benefits: ['15% descuento adicional', 'Servicios express']
    },
    'Diamante': {
        minVisits: 20,
        color: '#E8F4FD',
        icon: 'fas fa-gem',
        benefits: ['20% descuento adicional', 'Servicios VIP exclusivos']
    }
};

// Inicializar sistema de recompensas
function initializeRewardsSystem() {
    loadRewardsDisplay();
    loadLoyaltyProgress();
    loadPointsHistory();
    setupRewardsEventListeners();
}

// Cargar visualización de recompensas
function loadRewardsDisplay() {
    const rewardsContainer = document.getElementById('rewards-container');
    if (!rewardsContainer) return;

    const currentPoints = parseInt(localStorage.getItem('userPoints')) || 0;
    
    rewardsContainer.innerHTML = REWARDS_CONFIG.map(reward => {
        const canRedeem = currentPoints >= reward.pointsRequired;
        return `
            <div class="reward-card ${canRedeem ? 'available' : 'locked'}">
                <div class="reward-icon">
                    <i class="${reward.icon}"></i>
                </div>
                <div class="reward-info">
                    <h4>${reward.title}</h4>
                    <p>${reward.description}</p>
                    <div class="reward-points">
                        <span class="points-required">${reward.pointsRequired} puntos</span>
                        ${canRedeem ? 
                            `<button class="btn-redeem" onclick="redeemReward(${reward.pointsRequired}, '${reward.title}')">
                                Canjear
                            </button>` :
                            `<span class="points-needed">Necesitas ${reward.pointsRequired - currentPoints} puntos más</span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Cargar progreso de fidelidad
function loadLoyaltyProgress() {
    const loyaltyContainer = document.getElementById('loyalty-progress');
    if (!loyaltyContainer) return;

    const visits = parseInt(localStorage.getItem('visitCount')) || 0;
    const currentLevel = getLoyaltyLevel();
    const levelInfo = LOYALTY_LEVELS[currentLevel];
    
    // Calcular progreso hacia el siguiente nivel
    const nextLevelVisits = getNextLevelVisits(visits);
    const progressPercentage = nextLevelVisits ? ((visits % 5) / 5) * 100 : 100;

    loyaltyContainer.innerHTML = `
        <div class="loyalty-card" style="background-color: ${levelInfo.color}">
            <div class="loyalty-header">
                <div class="loyalty-icon">
                    <i class="${levelInfo.icon}"></i>
                </div>
                <div class="loyalty-info">
                    <h3>Nivel ${currentLevel}</h3>
                    <p>${visits} visitas realizadas</p>
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <p class="progress-text">
                    ${nextLevelVisits ? 
                        `${nextLevelVisits - visits} visitas más para el siguiente nivel` :
                        '¡Has alcanzado el nivel máximo!'
                    }
                </p>
            </div>
            
            <div class="level-benefits">
                <h4>Beneficios de tu nivel:</h4>
                <ul>
                    ${levelInfo.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Obtener visitas necesarias para el próximo nivel
function getNextLevelVisits(currentVisits) {
    const levels = Object.entries(LOYALTY_LEVELS).sort((a, b) => a[1].minVisits - b[1].minVisits);
    
    for (let [levelName, levelData] of levels) {
        if (currentVisits < levelData.minVisits) {
            return levelData.minVisits;
        }
    }
    return null; // Ya está en el nivel máximo
}

// Cargar historial de puntos
function loadPointsHistory() {
    const pointsHistoryContainer = document.getElementById('points-history');
    if (!pointsHistoryContainer) return;
    
    const activities = JSON.parse(localStorage.getItem('pointsActivities')) || [];
    
    if (activities.length === 0) {
        pointsHistoryContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No hay actividad de puntos aún</p>
            </div>
        `;
        return;
    }
    
    pointsHistoryContainer.innerHTML = activities.map(activity => `
        <div class="points-activity-item">
            <div class="activity-icon ${activity.points > 0 ? 'positive' : 'negative'}">
                <i class="fas ${activity.points > 0 ? 'fa-plus' : 'fa-minus'}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.reason}</h4>
                <p>${window.formatDate ? window.formatDate(activity.date, 'datetime') : activity.date}</p>
            </div>
            <div class="activity-points ${activity.points > 0 ? 'positive' : 'negative'}">
                ${activity.points > 0 ? '+' : ''}${activity.points}
            </div>
        </div>
    `).join('');
}

// Configurar event listeners para recompensas
function setupRewardsEventListeners() {
    // Botón para actualizar recompensas
    const refreshBtn = document.getElementById('refresh-rewards');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadRewardsDisplay();
            showNotification('Recompensas actualizadas', 'success');
        });
    }

    // Filtros de recompensas
    const filterBtns = document.querySelectorAll('.reward-filter');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            filterRewards(category);
            
            // Actualizar botones activos
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Filtrar recompensas por categoría
function filterRewards(category) {
    const rewardCards = document.querySelectorAll('.reward-card');
    
    rewardCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const rewardId = parseInt(card.dataset.rewardId);
            const reward = REWARDS_CONFIG.find(r => r.id === rewardId);
            
            if (reward && reward.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Simular ganancia de puntos (para testing)
function simulatePointsEarning() {
    const activities = [
        { points: 50, reason: 'Asistencia a cita' },
        { points: 10, reason: 'Puntualidad' },
        { points: 25, reason: 'Reseña en Google' },
        { points: 100, reason: 'Referir un amigo' }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    addPoints(randomActivity.points, randomActivity.reason);
    
    showNotification(`¡Ganaste ${randomActivity.points} puntos por ${randomActivity.reason}!`, 'success');
    
    // Actualizar displays
    setTimeout(() => {
        loadRewardsDisplay();
        loadLoyaltyProgress();
        loadPointsHistory();
    }, 1000);
}

// Formatear fecha y hora
// ELIMINAR ESTA FUNCIÓN (usar formatDate de script.js con parámetro 'datetime')
// function formatDateTime(dateString) {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('es-ES', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//     });
// }

// REEMPLAZAR TODAS LAS LLAMADAS A formatDateTime por:
// window.formatDate(dateString, 'datetime')

// Obtener estadísticas de usuario
function getUserStats() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const payments = JSON.parse(localStorage.getItem('paymentHistory')) || [];
    const redemptions = JSON.parse(localStorage.getItem('redemptions')) || [];
    
    return {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completada').length,
        totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
        totalRedemptions: redemptions.length,
        currentPoints: parseInt(localStorage.getItem('userPoints')) || 0,
        currentLevel: getLoyaltyLevel(),
        visitCount: parseInt(localStorage.getItem('visitCount')) || 0
    };
}

// Mostrar estadísticas en el dashboard
function displayUserStats() {
    const statsContainer = document.getElementById('user-stats');
    if (!statsContainer) return;
    
    const stats = getUserStats();
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h4>${stats.completedAppointments}</h4>
                    <p>Citas Completadas</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-info">
                    <h4>$${stats.totalSpent.toFixed(2)}</h4>
                    <p>Total Gastado</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="stat-info">
                    <h4>${stats.totalRedemptions}</h4>
                    <p>Recompensas Canjeadas</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-info">
                    <h4>${stats.currentPoints}</h4>
                    <p>Puntos Actuales</p>
                </div>
            </div>
        </div>
    `;
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeRewardsSystem();
    displayUserStats();
});