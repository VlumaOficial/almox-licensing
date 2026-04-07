// Componente para exibir status da licença
import React from 'react';
import { useLicense } from '../hooks/useLicense';
import { Shield, AlertCircle, CheckCircle, Clock, RefreshCw, X } from 'lucide-react';

interface LicenseStatusProps {
  className?: string;
  showRefresh?: boolean;
  compact?: boolean;
}

export const LicenseStatus: React.FC<LicenseStatusProps> = ({ 
  className = '', 
  showRefresh = true, 
  compact = false 
}) => {
  const { 
    licenseInfo, 
    isLoading, 
    error, 
    isValid, 
    plan, 
    daysRemaining, 
    refreshLicense 
  } = useLicense();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLicense();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPlanColor = (plan: string | null) => {
    switch (plan) {
      case 'trial': return 'text-green-600 bg-green-100';
      case 'basic': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-orange-600 bg-orange-100';
      case 'perpetual_cloud': return 'text-cyan-600 bg-cyan-100';
      case 'perpetual_local': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanIcon = (plan: string | null) => {
    switch (plan) {
      case 'trial': return Shield;
      case 'basic': return Shield;
      case 'professional': return Shield;
      case 'enterprise': return Shield;
      case 'perpetual_cloud': return Shield;
      case 'perpetual_local': return Shield;
      default: return AlertCircle;
    }
  };

  const formatDaysRemaining = (days: number) => {
    if (days >= 999999) return 'Vitalício';
    if (days === 1) return '1 dia';
    if (days === 0) return 'Expirado';
    return `${days} dias`;
  };

  const getStatusColor = (isValid: boolean, daysRemaining: number) => {
    if (!isValid) return 'text-red-600 bg-red-100';
    if (daysRemaining <= 7) return 'text-orange-600 bg-orange-100';
    if (daysRemaining <= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (isValid: boolean, daysRemaining: number) => {
    if (!isValid) return 'Inválida';
    if (daysRemaining <= 0) return 'Expirada';
    if (daysRemaining <= 7) return 'Expirando em breve';
    if (daysRemaining <= 30) return 'Atenção';
    return 'Ativa';
  };

  if (isLoading) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Carregando licença...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg shadow-sm border border-red-200 ${className}`}>
        <div className="flex items-center space-x-2">
          <X className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">Erro na licença: {error}</span>
        </div>
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className={`p-4 bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">Nenhuma licença ativada</span>
        </div>
      </div>
    );
  }

  const PlanIcon = getPlanIcon(plan);
  const planColor = getPlanColor(plan);
  const statusColor = getStatusColor(isValid, daysRemaining);
  const statusText = getStatusText(isValid, daysRemaining);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <PlanIcon className={`h-4 w-4 ${planColor.split(' ')[0]}`} />
        <span className={`text-xs px-2 py-1 rounded-full ${planColor}`}>
          {plan?.toUpperCase() || 'UNKNOWN'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
          {statusText}
        </span>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={`h-3 w-3 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <PlanIcon className={`h-8 w-8 ${planColor.split(' ')[0]}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Licença {plan?.toUpperCase() || 'UNKNOWN'}
              </h3>
              <p className="text-sm text-gray-600">
                Chave: {licenseInfo.key.substring(0, 20)}...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {isValid ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{statusText}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Validade</p>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-medium">
                  {formatDaysRemaining(daysRemaining)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Máquina</p>
              <p className="text-sm font-medium text-gray-900">
                {licenseInfo.machineId.substring(0, 12)}...
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Ativada em</p>
              <p className="text-sm font-medium text-gray-900">
                {licenseInfo.activatedAt 
                  ? new Date(licenseInfo.activatedAt).toLocaleDateString('pt-BR')
                  : 'Desconhecido'
                }
              </p>
            </div>
          </div>

          {licenseInfo.features && licenseInfo.features.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Recursos disponíveis</p>
              <div className="flex flex-wrap gap-2">
                {licenseInfo.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {feature.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Atualizar licença"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default LicenseStatus;
