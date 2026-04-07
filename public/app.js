// Sistema de Licenciamento AlmoxPro - Frontend
class LicenseManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLicenses();
        this.checkSystemStatus();
    }

    setupEventListeners() {
        // Validação de Licença
        document.getElementById('validateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateLicense();
        });

        // Ativação de Licença
        document.getElementById('activateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.activateLicense();
        });

        // Atualizar Lista
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadLicenses();
        });
    }

    async validateLicense() {
        const licenseKey = document.getElementById('licenseKey').value;
        const machineId = document.getElementById('machineId').value;
        const version = document.getElementById('version').value;
        const statusDiv = document.getElementById('validationStatus');
        const btn = document.getElementById('validateBtn');

        if (!licenseKey || !machineId) {
            this.showStatus(statusDiv, 'Preencha todos os campos obrigatórios', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = 'Validando... <span class="loading"></span>';

        try {
            const response = await fetch(`${this.apiBase}/validate-license`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseKey, machineId, version })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                this.showStatus(statusDiv, `
                    ✅ <strong>Licença Válida!</strong><br>
                    <strong>Plano:</strong> ${data.plan}<br>
                    <strong>Expira em:</strong> ${new Date(data.expiry).toLocaleDateString()}<br>
                    <strong>Dias restantes:</strong> ${data.daysRemaining}<br>
                    <strong>Funcionalidades:</strong> ${data.features.join(', ')}
                `, 'success');
            } else {
                this.showStatus(statusDiv, `❌ <strong>${data.error || 'Licença inválida'}</strong>`, 'error');
            }
        } catch (error) {
            this.showStatus(statusDiv, `❌ <strong>Erro na validação:</strong> ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Validar Licença';
        }
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
