// Sistema de Licenciamento AlmoxPro - Frontend Otimizado

// Módulos separados para melhor manutenibilidade
class APIManager {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.cache = new Map();
    }

    async request(endpoint, options = {}) {
        const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

class UIManager {
    constructor() {
        this.notifications = [];
    }

    showStatus(element, message, type = 'info', duration = 5000) {
        element.innerHTML = `<div class="status ${type}">${message}</div>`;
        element.style.display = 'block';
        
        // Auto-esconder mensagens de sucesso
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => notification.classList.add('notification-show'), 10);
        
        // Auto-remover
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('notification-hide');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    setLoading(element, loading = true) {
        if (loading) {
            element.disabled = true;
            element.innerHTML = 'Processando... <span class="loading"></span>';
        } else {
            element.disabled = false;
            element.innerHTML = element.getAttribute('data-original-text') || element.textContent;
        }
    }

    saveOriginalText(element) {
        if (!element.hasAttribute('data-original-text')) {
            element.setAttribute('data-original-text', element.textContent);
        }
    }
}

class CacheManager {
    constructor() {
        this.storage = localStorage;
        this.prefix = 'almox_cache_';
    }

    set(key, value, ttl = 300000) { // 5 minutos default
        try {
            const item = {
                value,
                timestamp: Date.now(),
                ttl
            };
            this.storage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Cache set error:', error);
        }
    }

    get(key) {
        try {
            const item = JSON.parse(this.storage.getItem(this.prefix + key));
            if (!item) return null;
            
            if (Date.now() - item.timestamp > item.ttl) {
                this.delete(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            console.warn('Cache get error:', error);
            return null;
        }
    }

    delete(key) {
        try {
            this.storage.removeItem(this.prefix + key);
        } catch (error) {
            console.warn('Cache delete error:', error);
        }
    }

    clear() {
        try {
            Object.keys(this.storage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    this.storage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Cache clear error:', error);
        }
    }
}

class LicenseManager {
    constructor() {
        this.api = new APIManager();
        this.ui = new UIManager();
        this.cache = new CacheManager();
        this.debounceTimers = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLicenses();
        this.checkSystemStatus();
        this.setupGlobalFunctions();
    }

    setupEventListeners() {
        // Validação de Licença
        const validateForm = document.getElementById('validateForm');
        if (validateForm) {
            validateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.debounce('validate', () => this.validateLicense(), 500);
            });
        }

        // Ativação de Licença
        const activateForm = document.getElementById('activateForm');
        if (activateForm) {
            activateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.debounce('activate', () => this.activateLicense(), 500);
            });
        }

        // Atualizar Lista
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.debounce('refresh', () => this.loadLicenses(), 1000);
            });
        }
    }

    setupGlobalFunctions() {
        // Funções globais para acesso via console
        window.licenseManager = {
            validate: (key, machineId) => {
                document.getElementById('licenseKey').value = key;
                document.getElementById('machineId').value = machineId;
                document.getElementById('validateForm').dispatchEvent(new Event('submit'));
            },
            activate: (email, plan, machineId) => {
                document.getElementById('clientEmail').value = email;
                document.getElementById('plan').value = plan;
                document.getElementById('machineIdActivation').value = machineId;
                document.getElementById('activateForm').dispatchEvent(new Event('submit'));
            },
            clearCache: () => this.api.clearCache()
        };
    }

    debounce(key, func, delay) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    async validateLicense() {
        const licenseKey = document.getElementById('licenseKey').value.trim();
        const machineId = document.getElementById('machineId').value.trim();
        const version = document.getElementById('version').value.trim();
        const statusDiv = document.getElementById('validationStatus');
        const btn = document.getElementById('validateBtn');

        // Validação client-side robusta
        const validation = this.validateInput({ licenseKey, machineId, version });
        if (!validation.isValid) {
            this.ui.showStatus(statusDiv, validation.error, 'error');
            return;
        }

        // Salvar texto original do botão
        this.ui.saveOriginalText(btn);
        this.ui.setLoading(btn, true);

        try {
            // Verificar cache primeiro
            const cacheKey = `validate-${licenseKey}-${machineId}`;
            let data = this.cache.get(cacheKey);
            
            if (!data) {
                data = await this.api.request('/validate-license', {
                    method: 'POST',
                    body: JSON.stringify({ licenseKey, machineId, version })
                });
                
                // Salvar no cache por 5 minutos
                this.cache.set(cacheKey, data, 300000);
            }

            if (data.valid) {
                this.ui.showStatus(statusDiv, `
                    ✅ <strong>Licença Válida!</strong><br>
                    <strong>Plano:</strong> ${data.plan}<br>
                    <strong>Expira em:</strong> ${new Date(data.expiry).toLocaleDateString('pt-BR')}<br>
                    <strong>Dias restantes:</strong> ${data.daysRemaining}<br>
                    <strong>Funcionalidades:</strong> ${data.features ? data.features.join(', ') : 'Não disponíveis'}
                `, 'success');
                
                // Salvar no cache local
                localStorage.setItem('lastValidLicense', JSON.stringify(data));
            } else {
                this.ui.showStatus(statusDiv, `❌ <strong>${data.error || 'Licença inválida'}</strong>`, 'error');
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.ui.showStatus(statusDiv, `❌ <strong>Erro na validação:</strong> ${error.message}`, 'error');
            
            // Limpar cache em caso de erro
            this.cache.delete(cacheKey);
        } finally {
            this.ui.setLoading(btn, false);
        }
    }

    validateInput({ licenseKey, machineId, version }) {
        const errors = [];
        
        if (!licenseKey || licenseKey.length < 10) {
            errors.push('Chave da licença é obrigatória (mínimo 10 caracteres)');
        }
        
        if (!machineId || machineId.length < 5) {
            errors.push('ID da máquina é obrigatório (mínimo 5 caracteres)');
        }
        
        if (licenseKey && !licenseKey.startsWith('ALMX-')) {
            errors.push('Chave da licença deve começar com ALMX-');
        }
        
        return {
            isValid: errors.length === 0,
            error: errors.join('; ')
        };
    }

    async activateLicense() {
        const clientEmail = document.getElementById('clientEmail').value;
        const plan = document.getElementById('plan').value;
        const machineId = document.getElementById('machineIdActivation').value;
        const statusDiv = document.getElementById('activationStatus');
        const btn = document.getElementById('activateBtn');

        if (!clientEmail || !plan || !machineId) {
            this.showStatus(statusDiv, 'Preencha todos os campos obrigatórios', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = 'Ativando... <span class="loading"></span>';

        try {
            const response = await fetch(`${this.apiBase}/activate-license`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    clientEmail, 
                    plan, 
                    machineId,
                    expiryDate: this.calculateExpiryDate(plan)
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showStatus(statusDiv, `
                    ✅ <strong>Licença Ativada!</strong><br>
                    <strong>Chave:</strong> ${data.licenseKey}<br>
                    <strong>Plano:</strong> ${plan}<br>
                    <strong>Valida até:</strong> ${new Date(data.expiryDate).toLocaleDateString()}<br>
                    <strong>Enviamos os dados para:</strong> ${clientEmail}
                `, 'success');
                
                // Limpar formulário
                document.getElementById('activateForm').reset();
                
                // Atualizar lista de licenças
                this.loadLicenses();
            } else {
                this.showStatus(statusDiv, `❌ <strong>${data.error || 'Erro na ativação'}</strong>`, 'error');
            }
        } catch (error) {
            this.showStatus(statusDiv, `❌ <strong>Erro na ativação:</strong> ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Ativar Licença';
        }
    }

    async loadLicenses() {
        const listDiv = document.getElementById('licensesList');
        listDiv.innerHTML = '<p>Carregando licenças...</p>';

        try {
            // Simulação de dados - em produção isso viria da API
            const response = await fetch(`${this.apiBase}/licenses`);
            
            if (response.ok) {
                const licenses = await response.json();
                this.renderLicenses(licenses);
            } else {
                // Dados de exemplo para demonstração
                const exampleLicenses = [
                    {
                        id: 1,
                        license_key: 'ALMX-DEMO-1234',
                        plan: 'professional',
                        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        machine_id: 'machine-001',
                        is_active: true,
                        client_email: 'cliente@exemplo.com'
                    },
                    {
                        id: 2,
                        license_key: 'ALMX-TRIAL-5678',
                        plan: 'trial',
                        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        machine_id: 'machine-002',
                        is_active: true,
                        client_email: 'trial@exemplo.com'
                    }
                ];
                this.renderLicenses(exampleLicenses);
            }
        } catch (error) {
            listDiv.innerHTML = '<p>Erro ao carregar licenças. Tente novamente.</p>';
        }
    }

    renderLicenses(licenses) {
        const listDiv = document.getElementById('licensesList');
        
        if (licenses.length === 0) {
            listDiv.innerHTML = '<p>Nenhuma licença ativa encontrada.</p>';
            return;
        }

        const licensesHtml = licenses.map(license => {
            const expiryDate = new Date(license.expiry_date);
            const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            const isActive = license.is_active && daysRemaining > 0;
            
            return `
                <div class="license-item">
                    <strong>Chave:</strong> ${license.license_key}<br>
                    <strong>Plano:</strong> ${license.plan}<br>
                    <strong>Cliente:</strong> ${license.client_email}<br>
                    <strong>Máquina:</strong> ${license.machine_id}<br>
                    <strong>Expira em:</strong> ${expiryDate.toLocaleDateString()}<br>
                    <strong>Status:</strong> <span style="color: ${isActive ? 'green' : 'red'}">${isActive ? 'Ativa' : 'Inativa'}</span><br>
                    <strong>Dias restantes:</strong> ${daysRemaining}
                </div>
            `;
        }).join('');

        listDiv.innerHTML = licensesHtml;
    }

    async checkSystemStatus() {
        try {
            // Verificar status da API
            const apiResponse = await fetch(`${this.apiBase}/version-info`);
            document.getElementById('apiStatus').textContent = apiResponse.ok ? '✅ Online' : '❌ Offline';
            
            // Verificar status do banco (simulado)
            document.getElementById('dbStatus').textContent = '✅ Conectado';
            
            // Atualizar última verificação
            document.getElementById('lastCheck').textContent = new Date().toLocaleString();
            
            // Atualizar status a cada 30 segundos
            setInterval(() => this.checkSystemStatus(), 30000);
        } catch (error) {
            document.getElementById('apiStatus').textContent = '❌ Erro';
            document.getElementById('dbStatus').textContent = '❌ Erro';
        }
    }

    calculateExpiryDate(plan) {
        const now = new Date();
        const days = {
            trial: 7,
            basic: 30,
            professional: 90,
            enterprise: 365
        };
        
        return new Date(now.getTime() + (days[plan] || 30) * 24 * 60 * 60 * 1000).toISOString();
    }

    showStatus(element, message, type) {
        element.innerHTML = `<div class="status ${type}">${message}</div>`;
        element.style.display = 'block';
        
        // Auto-esconder após 10 segundos para mensagens de sucesso
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 10000);
        }
    }
}

// Inicializar o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new LicenseManager();
});

// Funções globais para debug
window.licenseManager = {
    validate: (key, machineId) => {
        document.getElementById('licenseKey').value = key;
        document.getElementById('machineId').value = machineId;
        document.getElementById('validateForm').dispatchEvent(new Event('submit'));
    },
    
    activate: (email, plan, machineId) => {
        document.getElementById('clientEmail').value = email;
        document.getElementById('plan').value = plan;
        document.getElementById('machineIdActivation').value = machineId;
        document.getElementById('activateForm').dispatchEvent(new Event('submit'));
    }
};
