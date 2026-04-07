// Painel Administrativo AlmoxPro
class AdminPanel {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.licenses = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLicenses();
        this.loadStats();
    }

    setupEventListeners() {
        // Formulário de criação de licença
        document.getElementById('createLicenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createLicense();
        });

        // Formulário de configurações
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }

    async loadLicenses() {
        try {
            const response = await fetch(`${this.apiBase}/licenses`);
            
            if (response.ok) {
                this.licenses = await response.json();
                this.renderLicenses();
            } else {
                // Dados de exemplo para demonstração
                this.licenses = this.getExampleLicenses();
                this.renderLicenses();
            }
        } catch (error) {
            console.error('Erro ao carregar licenças:', error);
            this.licenses = this.getExampleLicenses();
            this.renderLicenses();
        }
    }

    getExampleLicenses() {
        return [
            {
                id: 1,
                license_key: 'ALMX-DEMO-1234',
                client_name: 'João Silva',
                client_email: 'joao@exemplo.com',
                plan: 'professional',
                expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                machine_id: 'machine-001',
                is_active: true,
                notes: 'Licença demonstrativa'
            },
            {
                id: 2,
                license_key: 'ALMX-TRIAL-5678',
                client_name: 'Maria Santos',
                client_email: 'maria@exemplo.com',
                plan: 'trial',
                expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                machine_id: 'machine-002',
                is_active: true,
                notes: 'Trial de 7 dias'
            },
            {
                id: 3,
                license_key: 'ALMX-EXP-9999',
                client_name: 'Pedro Costa',
                client_email: 'pedro@exemplo.com',
                plan: 'basic',
                expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                machine_id: 'machine-003',
                is_active: false,
                notes: 'Licença expirou'
            }
        ];
    }

    renderLicenses() {
        const tbody = document.getElementById('licensesTableBody');
        
        if (this.licenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma licença encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = this.licenses.map(license => {
            const expiryDate = new Date(license.expiry_date);
            const now = new Date();
            const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            let statusClass = 'status-active';
            let statusText = 'Ativa';
            
            if (!license.is_active) {
                statusClass = 'status-inactive';
                statusText = 'Inativa';
            } else if (daysRemaining <= 0) {
                statusClass = 'status-expired';
                statusText = 'Expirada';
            } else if (daysRemaining <= 7) {
                statusClass = 'status-expired';
                statusText = 'Para Expirar';
            }

            return `
                <tr>
                    <td>${license.id}</td>
                    <td><code>${license.license_key}</code></td>
                    <td>${license.client_name}</td>
                    <td>${license.client_email}</td>
                    <td><span class="badge badge-${license.plan}">${license.plan}</span></td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>${expiryDate.toLocaleDateString()}</td>
                    <td>
                        <button class="btn" style="margin-right: 5px;" onclick="editLicense(${license.id})">✏️</button>
                        <button class="btn btn-danger" onclick="deactivateLicense(${license.id})">🚫</button>
                        <button class="btn btn-danger" onclick="deleteLicense(${license.id})">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async createLicense() {
        const formData = {
            clientName: document.getElementById('clientName').value,
            clientEmail: document.getElementById('clientEmail').value,
            plan: document.getElementById('plan').value,
            machineId: document.getElementById('machineId').value,
            notes: document.getElementById('notes').value,
            expiryDate: this.calculateExpiryDate(document.getElementById('plan').value)
        };

        try {
            const response = await fetch(`${this.apiBase}/licenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Licença criada com sucesso!', 'success');
                document.getElementById('createLicenseForm').reset();
                this.loadLicenses();
                this.loadStats();
            } else {
                const error = await response.json();
                this.showNotification(`Erro: ${error.message || 'Falha ao criar licença'}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro na criação: ${error.message}`, 'error');
        }
    }

    async editLicense(id) {
        const license = this.licenses.find(l => l.id === id);
        if (!license) return;

        // Preencher formulário com dados da licença
        document.getElementById('clientName').value = license.client_name;
        document.getElementById('clientEmail').value = license.client_email;
        document.getElementById('plan').value = license.plan;
        document.getElementById('machineId').value = license.machine_id;
        document.getElementById('notes').value = license.notes || '';

        // Mudar o botão para atualizar
        const form = document.getElementById('createLicenseForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Atualizar Licença';
        submitBtn.onclick = () => this.updateLicense(id);

        // Scroll para o formulário
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async updateLicense(id) {
        const formData = {
            clientName: document.getElementById('clientName').value,
            clientEmail: document.getElementById('clientEmail').value,
            plan: document.getElementById('plan').value,
            machineId: document.getElementById('machineId').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch(`${this.apiBase}/licenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Licença atualizada com sucesso!', 'success');
                this.resetForm();
                this.loadLicenses();
            } else {
                const error = await response.json();
                this.showNotification(`Erro: ${error.message || 'Falha ao atualizar licença'}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro na atualização: ${error.message}`, 'error');
        }
    }

    async deactivateLicense(id) {
        if (!confirm('Tem certeza que deseja desativar esta licença?')) return;

        try {
            const response = await fetch(`${this.apiBase}/deactivate-license`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseId: id })
            });

            if (response.ok) {
                this.showNotification('Licença desativada com sucesso!', 'success');
                this.loadLicenses();
                this.loadStats();
            } else {
                const error = await response.json();
                this.showNotification(`Erro: ${error.message || 'Falha ao desativar licença'}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro na desativação: ${error.message}`, 'error');
        }
    }

    async deleteLicense(id) {
        if (!confirm('Tem certeza que deseja excluir esta licença? Esta ação é irreversível!')) return;

        try {
            const response = await fetch(`${this.apiBase}/licenses/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Licença excluída com sucesso!', 'success');
                this.loadLicenses();
                this.loadStats();
            } else {
                const error = await response.json();
                this.showNotification(`Erro: ${error.message || 'Falha ao excluir licença'}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro na exclusão: ${error.message}`, 'error');
        }
    }

    async loadStats() {
        try {
            // Calcular estatísticas baseadas nas licenças carregadas
            const total = this.licenses.length;
            const active = this.licenses.filter(l => l.is_active && new Date(l.expiry_date) > new Date()).length;
            const expired = this.licenses.filter(l => new Date(l.expiry_date) <= new Date()).length;
            
            // Calcular receita (simulada)
            const planPrices = {
                trial: 0,
                basic: 97,
                professional: 297,
                enterprise: 997
            };
            
            const revenue = this.licenses.reduce((total, license) => {
                return total + (planPrices[license.plan] || 0);
            }, 0);

            // Atualizar interface
            document.getElementById('totalLicenses').textContent = total;
            document.getElementById('activeLicenses').textContent = active;
            document.getElementById('expiredLicenses').textContent = expired;
            document.getElementById('revenue').textContent = `R$ ${revenue.toLocaleString('pt-BR')}`;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async saveSettings() {
        const settings = {
            maxMachines: parseInt(document.getElementById('maxMachines').value),
            gracePeriod: parseInt(document.getElementById('gracePeriod').value),
            autoDeactivate: document.getElementById('autoDeactivate').value === 'true'
        };

        try {
            const response = await fetch(`${this.apiBase}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showNotification('Configurações salvas com sucesso!', 'success');
            } else {
                const error = await response.json();
                this.showNotification(`Erro: ${error.message || 'Falha ao salvar configurações'}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro ao salvar configurações: ${error.message}`, 'error');
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

    resetForm() {
        document.getElementById('createLicenseForm').reset();
        const submitBtn = document.querySelector('#createLicenseForm button[type="submit"]');
        submitBtn.textContent = 'Criar Licença';
        submitBtn.onclick = () => this.createLicense();
    }

    showNotification(message, type) {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Funções globais para acesso via HTML
window.loadLicenses = () => {
    if (window.adminPanel) {
        window.adminPanel.loadLicenses();
        window.adminPanel.loadStats();
    }
};

window.editLicense = (id) => {
    if (window.adminPanel) {
        window.adminPanel.editLicense(id);
    }
};

window.deactivateLicense = (id) => {
    if (window.adminPanel) {
        window.adminPanel.deactivateLicense(id);
    }
};

window.deleteLicense = (id) => {
    if (window.adminPanel) {
        window.adminPanel.deleteLicense(id);
    }
};

window.showCreateModal = () => {
    document.getElementById('modal').style.display = 'block';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Adicionar estilos para badges
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    .badge-trial {
        background: #ffc107;
        color: #000;
    }
    .badge-basic {
        background: #17a2b8;
        color: #fff;
    }
    .badge-professional {
        background: #667eea;
        color: #fff;
    }
    .badge-enterprise {
        background: #343a40;
        color: #fff;
    }
`;
document.head.appendChild(style);
