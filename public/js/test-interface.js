// Interface de Testes para Almox-Licensing - Módulo 1
class TestInterface {
    constructor() {
        this.api = window.AlmoxAPI;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSystemStatus();
        this.api.log('info', 'Interface de testes inicializada');
    }

    setupEventListeners() {
        // Formulário de Trial
        const trialForm = document.getElementById('trial-form');
        if (trialForm) {
            trialForm.addEventListener('submit', (e) => this.handleTrialSubmit(e));
        }

        // Formulário de Validação
        const validationForm = document.getElementById('validation-form');
        if (validationForm) {
            validationForm.addEventListener('submit', (e) => this.handleValidationSubmit(e));
        }

        // Botão de Health Check
        const healthCheckBtn = document.getElementById('health-check-btn');
        if (healthCheckBtn) {
            healthCheckBtn.addEventListener('click', () => this.handleHealthCheck());
        }

        // Botões de Logs
        const clearLogsBtn = document.getElementById('clear-logs');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => this.api.clearLogs());
        }

        const exportLogsBtn = document.getElementById('export-logs');
        if (exportLogsBtn) {
            exportLogsBtn.addEventListener('click', () => this.api.exportLogs());
        }
    }

    async checkSystemStatus() {
        this.updateStatusIndicator('database', 'checking', 'Verificando...');
        this.updateStatusIndicator('api', 'checking', 'Verificando...');

        try {
            const status = await this.api.checkSystemStatus();
            
            // Atualizar indicadores
            this.updateStatusIndicator('database', 
                status.database ? 'healthy' : 'unhealthy', 
                status.database ? 'Conectado' : 'Erro'
            );
            
            this.updateStatusIndicator('api', 
                status.apis ? 'healthy' : 'unhealthy', 
                status.apis ? 'Online' : 'Offline'
            );

            this.api.log('info', 'Status do sistema verificado', status);
        } catch (error) {
            this.updateStatusIndicator('database', 'unhealthy', 'Erro');
            this.updateStatusIndicator('api', 'unhealthy', 'Erro');
            this.api.log('error', 'Falha ao verificar status', error.message);
        }
    }

    updateStatusIndicator(type, status, text) {
        const indicator = document.getElementById(`${type === 'database' ? 'db' : 'api'}-indicator`);
        if (!indicator) return;

        const dot = indicator.querySelector('.status-dot');
        const textElement = indicator.querySelector('.status-text');

        if (dot) {
            dot.className = `status-dot ${status}`;
        }

        if (textElement) {
            textElement.textContent = text;
        }
    }

    async handleTrialSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const resultDiv = document.getElementById('trial-result');
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
        
        // Limpar resultado anterior
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            this.api.log('info', 'Iniciando registro de trial', data);

            const result = await this.api.registerTrial(data);

            // Salvar dados localmente
            this.api.saveLocalData('installation', {
                installation_id: result.installation_id,
                license_key: result.license_key,
                customer_name: data.name,
                customer_email: data.email,
                trial_expires_at: result.trial_expires_at
            });

            // Preencher campos de validação
            const instIdInput = document.getElementById('inst-id');
            const licenseKeyInput = document.getElementById('license-key');
            
            if (instIdInput) instIdInput.value = result.installation_id;
            if (licenseKeyInput) licenseKeyInput.value = result.license_key;

            // Exibir resultado
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="success-message">
                        <h4> Trial Registrado com Sucesso!</h4>
                        <p><strong>Installation ID:</strong> ${result.installation_id}</p>
                        <p><strong>License Key:</strong> ${result.license_key}</p>
                        <p><strong>Expira em:</strong> ${new Date(result.trial_expires_at).toLocaleString('pt-BR')}</p>
                        <p><strong>Status:</strong> ${result.message}</p>
                    </div>
                `;
                resultDiv.className = 'test-result success';
            }

            this.api.log('success', 'Trial registrado com sucesso', result);

        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="error-message">
                        <h4>Erro ao Registrar Trial</h4>
                        <p><strong>Erro:</strong> ${error.message}</p>
                        <p>Verifique os dados e tente novamente.</p>
                    </div>
                `;
                resultDiv.className = 'test-result error';
            }

            this.api.log('error', 'Falha no registro de trial', error.message);
        } finally {
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar Trial';
        }
    }

    async handleValidationSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const resultDiv = document.getElementById('validation-result');
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.textContent = 'Validando...';
        
        // Limpar resultado anterior
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }

        try {
            const formData = new FormData(form);
            const { installation_id, license_key } = Object.fromEntries(formData.entries());

            if (!installation_id || !license_key) {
                throw new Error('Installation ID e License Key são obrigatórios');
            }

            this.api.log('info', 'Iniciando validação de licença', {
                installation_id,
                license_key: license_key.substring(0, 10) + '...'
            });

            const result = await this.api.validateLicense(installation_id, license_key);

            // Exibir resultado
            if (resultDiv) {
                let statusClass = result.valid ? 'success' : 'error';
                let statusIcon = result.valid ? 'check-circle' : 'x-circle';
                
                resultDiv.innerHTML = `
                    <div class="validation-result">
                        <h4>
                            <span class="icon">${statusIcon}</span>
                            Licença ${result.valid ? 'Válida' : 'Inválida'}
                        </h4>
                        ${result.valid ? `
                            <div class="license-info">
                                <p><strong>Cliente:</strong> ${result.license_info?.customer_name || 'N/A'}</p>
                                <p><strong>Tipo:</strong> ${this.formatLicenseType(result.license_info?.license_type)}</p>
                                <p><strong>Expira em:</strong> ${new Date(result.license_info?.expires_at).toLocaleString('pt-BR')}</p>
                                <p><strong>Dias restantes:</strong> ${result.license_info?.days_remaining || 0}</p>
                                <p><strong>Recorrente:</strong> ${result.license_info?.recurring ? 'Sim' : 'Não'}</p>
                                <p><strong>Funcionalidades:</strong> ${result.license_info?.features?.join(', ') || 'N/A'}</p>
                            </div>
                        ` : `
                            <div class="error-info">
                                <p><strong>Erro:</strong> ${result.error}</p>
                                ${result.expired_at ? `<p><strong>Expirou em:</strong> ${new Date(result.expired_at).toLocaleString('pt-BR')}</p>` : ''}
                                ${result.customer_email ? `<p><strong>Email:</strong> ${result.customer_email}</p>` : ''}
                            </div>
                        `}
                    </div>
                `;
                resultDiv.className = `test-result ${statusClass}`;
            }

            this.api.log('success', 'Validação concluída', {
                valid: result.valid,
                license_type: result.license_info?.license_type
            });

        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="error-message">
                        <h4>Erro na Validação</h4>
                        <p><strong>Erro:</strong> ${error.message}</p>
                        <p>Verifique os dados e tente novamente.</p>
                    </div>
                `;
                resultDiv.className = 'test-result error';
            }

            this.api.log('error', 'Falha na validação', error.message);
        } finally {
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Validar Licença';
        }
    }

    async handleHealthCheck() {
        const btn = document.getElementById('health-check-btn');
        const resultDiv = document.getElementById('health-result');
        
        // Desabilitar botão
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        
        // Limpar resultado anterior
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }

        try {
            this.api.log('info', 'Iniciando health check');

            const result = await this.api.healthCheck();

            // Exibir resultado
            if (resultDiv) {
                const statusClass = result.status === 'healthy' ? 'success' : 'error';
                const statusIcon = result.status === 'healthy' ? 'check-circle' : 'x-circle';
                
                resultDiv.innerHTML = `
                    <div class="health-result">
                        <h4>
                            <span class="icon">${statusIcon}</span>
                            Sistema ${result.status === 'healthy' ? 'Saudável' : 'Não Saudável'}
                        </h4>
                        <div class="health-details">
                            <p><strong>Status:</strong> ${result.status}</p>
                            <p><strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleString('pt-BR')}</p>
                            <p><strong>Response Time:</strong> ${result.response_time_ms}ms</p>
                            <p><strong>Version:</strong> ${result.version}</p>
                            <p><strong>Environment:</strong> ${result.environment}</p>
                            <p><strong>Uptime:</strong> ${Math.floor(result.uptime / 60)}min</p>
                            
                            <div class="services-status">
                                <h5>Serviços:</h5>
                                <p><strong>Database:</strong> 
                                    <span class="${result.services.database.healthy ? 'healthy' : 'unhealthy'}">
                                        ${result.services.database.healthy ? 'OK' : 'ERRO'}
                                    </span>
                                </p>
                                ${result.services.database.error ? `<p class="error"><strong>DB Error:</strong> ${result.services.database.error}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                resultDiv.className = `test-result ${statusClass}`;
            }

            this.api.log('success', 'Health check concluído', result);

        } catch (error) {
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="error-message">
                        <h4>Erro no Health Check</h4>
                        <p><strong>Erro:</strong> ${error.message}</p>
                        <p>O sistema pode estar indisponível.</p>
                    </div>
                `;
                resultDiv.className = 'test-result error';
            }

            this.api.log('error', 'Falha no health check', error.message);
        } finally {
            // Reabilitar botão
            btn.disabled = false;
            btn.textContent = 'Verificar Saúde do Sistema';
            
            // Atualizar indicadores de status
            this.checkSystemStatus();
        }
    }

    formatLicenseType(type) {
        const typeMap = {
            'trial': 'Trial',
            'monthly': 'Mensal',
            'monthly_recurring': 'Mensal Recorrente',
            'quarterly': 'Trimestral',
            'semiannual': 'Semestral',
            'annual': 'Anual',
            'lifetime': 'Vitalícia'
        };
        
        return typeMap[type] || type;
    }

    // Adicionar estilos inline para ícones
    addIconStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .icon {
                display: inline-block;
                margin-right: 8px;
            }
            .icon::before {
                font-family: monospace;
            }
            .icon.check-circle::before { content: "OK"; color: #27ae60; }
            .icon.x-circle::before { content: "X"; color: #e74c3c; }
            
            .healthy { color: #27ae60; font-weight: bold; }
            .unhealthy { color: #e74c3c; font-weight: bold; }
            
            .success-message, .error-message, .validation-result, .health-result {
                padding: 15px;
                border-radius: 8px;
                margin-top: 10px;
            }
            
            .success-message, .validation-result.success, .health-result.success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            
            .error-message, .validation-result.error, .health-result.error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            
            .license-info, .health-details, .error-info {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(0,0,0,0.1);
            }
            
            .services-status {
                margin-top: 15px;
                padding: 10px;
                background: rgba(0,0,0,0.05);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar interface quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const testInterface = new TestInterface();
    testInterface.addIconStyles();
    
    // Adicionar ao escopo global para debugging
    window.TestInterface = testInterface;
});
