// Cliente API para Almox-Licensing - Módulo 1
class AlmoxLicensingAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.logs = [];
    }

    // Log de eventos
    log(level, message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            data: data ? JSON.stringify(data, null, 2) : null
        };
        
        this.logs.push(logEntry);
        this.updateLogsDisplay();
        console.log(`[${logEntry.level}] ${logEntry.message}`, data);
    }

    // Atualizar display de logs
    updateLogsDisplay() {
        const logsContainer = document.getElementById('logs-content');
        if (!logsContainer) return;

        const latestLogs = this.logs.slice(-50); // Últimos 50 logs
        logsContainer.innerHTML = latestLogs
            .map(log => `<div class="log-entry ${log.level.toLowerCase()}">[${log.timestamp}] ${log.level}: ${log.message}${log.data ? '\n' + log.data : ''}</div>`)
            .join('');
        
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Fazer requisição genérica
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        this.log('info', `Requisição: ${options.method || 'GET'} ${url}`, config);

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            this.log('info', `Resposta: ${response.status} ${response.statusText}`, data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            this.log('error', 'Erro na requisição', {
                url,
                method: options.method || 'GET',
                error: error.message
            });
            throw error;
        }
    }

    // Health Check
    async healthCheck() {
        try {
            const result = await this.request('/health');
            this.log('success', 'Health check executado com sucesso', result);
            return result;
        } catch (error) {
            this.log('error', 'Health check falhou', error.message);
            throw error;
        }
    }

    // Registrar Trial
    async registerTrial(data) {
        try {
            // Gerar installation_id se não fornecido
            if (!data.installation_id) {
                data.installation_id = this.generateInstallationId();
            }

            // Adicionar dados do sistema
            const trialData = {
                ...data,
                version: '1.0.0',
                os_info: this.getOSInfo(),
                hardware_fingerprint: this.generateHardwareFingerprint()
            };

            this.log('info', 'Registrando instalação trial', trialData);

            const result = await this.request('/register-trial', {
                method: 'POST',
                body: JSON.stringify(trialData)
            });

            this.log('success', 'Trial registrado com sucesso', result);
            return result;
        } catch (error) {
            this.log('error', 'Falha ao registrar trial', error.message);
            throw error;
        }
    }

    // Validar Licença
    async validateLicense(installationId, licenseKey, validationContext = {}) {
        try {
            const data = {
                installation_id: installationId,
                license_key: licenseKey,
                validation_context: {
                    hardware_fingerprint: this.generateHardwareFingerprint(),
                    ip_address: await this.getClientIP(),
                    user_agent: navigator.userAgent,
                    ...validationContext
                }
            };

            this.log('info', 'Validando licença', {
                installation_id: installationId,
                license_key: licenseKey.substring(0, 10) + '...'
            });

            const result = await this.request('/validate-license', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            this.log('success', 'Licença validada', {
                valid: result.valid,
                license_type: result.license_info?.license_type
            });

            return result;
        } catch (error) {
            this.log('error', 'Falha na validação da licença', error.message);
            throw error;
        }
    }

    // Gerar Installation ID
    generateInstallationId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        const hardware = this.generateHardwareFingerprint();
        return `ALX_${timestamp}_${random}_${hardware}`;
    }

    // Gerar Hardware Fingerprint
    generateHardwareFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Almox-Licensing Fingerprint', 2, 2);
            
            const fingerprint = canvas.toDataURL().slice(-50);
            return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        } catch (error) {
            // Fallback
            const combined = `${navigator.userAgent}${screen.width}x${screen.height}${new Date().getTimezoneOffset()}`;
            return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        }
    }

    // Obter informações do SO
    getOSInfo() {
        const userAgent = navigator.userAgent;
        let os = 'Unknown';
        
        if (userAgent.indexOf('Win') !== -1) os = 'Windows';
        else if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
        else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
        else if (userAgent.indexOf('Android') !== -1) os = 'Android';
        else if (userAgent.indexOf('iOS') !== -1) os = 'iOS';
        
        return `${os} ${userAgent.substring(userAgent.lastIndexOf('/') + 1)}`;
    }

    // Obter IP do cliente
    async getClientIP() {
        try {
            // Tentar obter IP através de serviço externo
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            // Fallback para headers
            return null;
        }
    }

    // Limpar logs
    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
        this.log('info', 'Logs limpos');
    }

    // Exportar logs
    exportLogs() {
        const logsText = this.logs
            .map(log => `[${log.timestamp}] ${log.level}: ${log.message}${log.data ? '\n' + log.data : ''}`)
            .join('\n\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `almox-licensing-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('info', 'Logs exportados');
    }

    // Verificar status do sistema
    async checkSystemStatus() {
        const status = {
            database: false,
            apis: false,
            overall: false
        };

        try {
            // Testar health check
            const health = await this.healthCheck();
            
            if (health.status === 'healthy') {
                status.database = health.services.database.healthy;
                status.apis = true;
                status.overall = true;
            }
        } catch (error) {
            this.log('error', 'Falha ao verificar status do sistema', error.message);
        }

        return status;
    }

    // Formatar resultado para display
    formatResult(result, type = 'info') {
        const resultDiv = document.createElement('div');
        resultDiv.className = `test-result ${type}`;
        resultDiv.textContent = JSON.stringify(result, null, 2);
        return resultDiv;
    }

    // Salvar dados localmente
    saveLocalData(key, data) {
        try {
            localStorage.setItem(`almox_licensing_${key}`, JSON.stringify(data));
            this.log('info', `Dados salvos localmente: ${key}`);
        } catch (error) {
            this.log('error', `Falha ao salvar dados localmente: ${key}`, error.message);
        }
    }

    // Carregar dados locais
    loadLocalData(key) {
        try {
            const data = localStorage.getItem(`almox_licensing_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            this.log('error', `Falha ao carregar dados locais: ${key}`, error.message);
            return null;
        }
    }

    // Remover dados locais
    removeLocalData(key) {
        try {
            localStorage.removeItem(`almox_licensing_${key}`);
            this.log('info', `Dados removidos localmente: ${key}`);
        } catch (error) {
            this.log('error', `Falha ao remover dados locais: ${key}`, error.message);
        }
    }
}

// Instância global da API
window.AlmoxAPI = new AlmoxLicensingAPI();

// Auto-inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.AlmoxAPI.log('info', 'Almox-Licensing API Client inicializado');
    
    // Verificar se há dados salvos
    const savedInstallation = window.AlmoxAPI.loadLocalData('installation');
    if (savedInstallation) {
        window.AlmoxAPI.log('info', 'Instalação local encontrada', savedInstallation);
        
        // Preencher formulários com dados salvos
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const instIdInput = document.getElementById('inst-id');
        const licenseKeyInput = document.getElementById('license-key');
        
        if (nameInput) nameInput.value = savedInstallation.customer_name || '';
        if (emailInput) emailInput.value = savedInstallation.customer_email || '';
        if (instIdInput) instIdInput.value = savedInstallation.installation_id || '';
        if (licenseKeyInput) licenseKeyInput.value = savedInstallation.license_key || '';
    }
});
