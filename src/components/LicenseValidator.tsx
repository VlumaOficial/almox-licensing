// Componente para validação e controle de licença
import React, { useState, useEffect } from 'react';
import { useDailyValidator } from '../utils/DailyValidator';
import { Shield, Lock, Unlock, AlertTriangle, Phone, Mail, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

interface LicenseValidatorProps {
  validationEndpoint: string;
  applicationName: string;
  applicationVersion?: string;
  onValidLicense?: () => void;
  onInvalidLicense?: (message: string) => void;
  className?: string;
}

export const LicenseValidator: React.FC<LicenseValidatorProps> = ({
  validationEndpoint,
  applicationName,
  applicationVersion,
  onValidLicense,
  onInvalidLicense,
  className = ''
}) => {
  const { isFrozen, statusMessage, isValidating, validateNow } = useDailyValidator(
    validationEndpoint,
    applicationName,
    applicationVersion
  );

  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);

  useEffect(() => {
    if (isFrozen) {
      onInvalidLicense?.(statusMessage);
    } else {
      onValidLicense?.();
    }
  }, [isFrozen, statusMessage, onValidLicense, onInvalidLicense]);

  const handleValidateNow = async () => {
    const result = await validateNow();
    setLastValidationResult(result);
    
    if (result.success && result.isValid) {
      // Licença válida - mostrar sucesso
      setTimeout(() => {
        setLastValidationResult(null);
      }, 3000);
    }
  };

  const handleContactSupport = () => {
    setShowSupportInfo(true);
  };

  if (isFrozen) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="h-8 w-8 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Licença Inválida
            </h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              {statusMessage}
            </p>
            
            {lastValidationResult?.supportInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Entre em contato com o suporte
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-yellow-700">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <a 
                      href={`mailto:${lastValidationResult.supportInfo.email}`}
                      className="hover:underline"
                    >
                      {lastValidationResult.supportInfo.email}
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{lastValidationResult.supportInfo.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={lastValidationResult.supportInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Site de suporte
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleValidateNow}
              disabled={isValidating}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
              <span>Valide Licença</span>
            </button>
            
            <button
              onClick={handleContactSupport}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <Phone className="h-4 w-4" />
              <span>Contato</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modo normal - sistema liberado
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Unlock className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">
              Sistema Liberado
            </p>
            <p className="text-sm text-green-700">
              {statusMessage}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleValidateNow}
          disabled={isValidating}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
        >
          <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} />
          <span>Verificar</span>
        </button>
      </div>
      
      {lastValidationResult?.success && lastValidationResult.isValid && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span>Licença validada com sucesso!</span>
        </div>
      )}
    </div>
  );
};

// Componente para configurações (único acessível quando congelado)
export const LicenseConfigPanel: React.FC<LicenseValidatorProps> = ({
  validationEndpoint,
  applicationName,
  applicationVersion,
  className = ''
}) => {
  const { isFrozen, statusMessage, isValidating, validateNow } = useDailyValidator(
    validationEndpoint,
    applicationName,
    applicationVersion
  );

  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [unfreezeResult, setUnfreezeResult] = useState<string | null>(null);

  const handleUnfreeze = async () => {
    if (!adminKey.trim()) {
      setUnfreezeResult('Chave de administrador obrigatória');
      return;
    }

    try {
      // Para teste, vamos simular o unfreeze
      const success = adminKey === 'ALMX-ADMIN-MASTER-KEY-2024';
      
      if (success) {
        setUnfreezeResult('Sistema desbloqueado com sucesso!');
        setTimeout(() => setUnfreezeResult(null), 3000);
      } else {
        setUnfreezeResult('Chave de administrador inválida');
      }
    } catch (error) {
      setUnfreezeResult('Erro ao desbloquear sistema');
    }
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configurações de Licença
            </h2>
            <p className="text-sm text-gray-600">
              Gerencie a licença do sistema
            </p>
          </div>
        </div>

        {/* Status atual */}
        <div className={`mb-6 p-4 rounded-lg ${
          isFrozen ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isFrozen ? (
              <Lock className="h-6 w-6 text-red-600" />
            ) : (
              <Unlock className="h-6 w-6 text-green-600" />
            )}
            <div>
              <p className={`font-medium ${
                isFrozen ? 'text-red-800' : 'text-green-800'
              }`}>
                {isFrozen ? 'Sistema Bloqueado' : 'Sistema Liberado'}
              </p>
              <p className={`text-sm ${
                isFrozen ? 'text-red-700' : 'text-green-700'
              }`}>
                {statusMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Validação manual */}
        <div className="mb-6">
          <button
            onClick={validateNow}
            disabled={isValidating}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`h-5 w-5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>Valide Licença</span>
          </button>
        </div>

        {/* Desbloqueio administrativo */}
        {isFrozen && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Desbloqueio Administrativo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave de Administrador
                </label>
                <div className="flex space-x-2">
                  <input
                    type={showAdminKey ? 'text' : 'password'}
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Digite a chave de administrador"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {showAdminKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleUnfreeze}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                Desbloquear Sistema
              </button>
              
              {unfreezeResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  unfreezeResult.includes('sucesso') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {unfreezeResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações de suporte */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Suporte
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:suporte@almoxpro.com" className="hover:text-blue-600">
                suporte@almoxpro.com
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>(11) 9999-9999</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <a 
                href="https://almoxpro.com/suporte" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600"
              >
                Portal de suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseValidator;
