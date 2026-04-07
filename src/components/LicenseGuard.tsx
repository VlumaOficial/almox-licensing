// Componente para proteger conteúdo baseado na licença
import React from 'react';
import { useLicense } from '../hooks/useLicense';
import { AlertCircle, Lock, Crown } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'trial' | 'basic' | 'professional' | 'enterprise' | 'perpetual_cloud' | 'perpetual_local';
  requiredFeature?: string;
  fallback?: React.ReactNode;
  showMessage?: boolean;
  className?: string;
}

const planHierarchy = {
  trial: 0,
  basic: 1,
  professional: 2,
  enterprise: 3,
  perpetual_cloud: 3,
  perpetual_local: 3
};

export const LicenseGuard: React.FC<LicenseGuardProps> = ({
  children,
  requiredPlan,
  requiredFeature,
  fallback,
  showMessage = true,
  className = ''
}) => {
  const { licenseInfo, isValid, plan, features } = useLicense();

  // Se não há licença ou é inválida
  if (!isValid || !licenseInfo) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showMessage) {
      return null;
    }

    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <Lock className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">
              Licença Necessária
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Você precisa de uma licença ativa para acessar este recurso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar plano requerido
  if (requiredPlan) {
    const userPlanLevel = planHierarchy[plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      if (fallback) {
        return <>{fallback}</>;
      }

      if (!showMessage) {
        return null;
      }

      return (
        <div className={`p-6 bg-orange-50 border border-orange-200 rounded-lg ${className}`}>
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-medium text-orange-800">
                Plano {requiredPlan.toUpperCase()} Necessário
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Este recurso está disponível apenas para o plano {requiredPlan.toUpperCase()}.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar feature requerida
  if (requiredFeature && !features.includes(requiredFeature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showMessage) {
      return null;
    }

    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-800">
              Recurso Não Disponível
            </h3>
            <p className="text-sm text-red-700 mt-1">
              O recurso "{requiredFeature.replace('_', ' ').toUpperCase()}" não está disponível no seu plano atual.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Licença válida e tem permissão
  return <>{children}</>;
};

// Componente para múltiplas condições
interface MultiLicenseGuardProps {
  children: React.ReactNode;
  conditions: Array<{
    plan?: string;
    feature?: string;
    children: React.ReactNode;
  }>;
  fallback?: React.ReactNode;
  className?: string;
}

export const MultiLicenseGuard: React.FC<MultiLicenseGuardProps> = ({
  children,
  conditions,
  fallback,
  className = ''
}) => {
  const { isValid, plan, features } = useLicense();

  if (!isValid) {
    return <>{fallback}</>;
  }

  // Encontrar primeira condição que corresponde
  for (const condition of conditions) {
    const planMatch = !condition.plan || plan === condition.plan;
    const featureMatch = !condition.feature || features.includes(condition.feature);

    if (planMatch && featureMatch) {
      return <>{condition.children}</>;
    }
  }

  // Nenhuma condição correspondeu
  return <>{fallback || children}</>;
};

// Hook personalizado para verificar permissões
export const useLicenseGuard = () => {
  const { isValid, plan, features } = useLicense();

  const hasPlan = (requiredPlan: string) => {
    if (!isValid) return false;
    
    const userPlanLevel = planHierarchy[plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 0;
    
    return userPlanLevel >= requiredPlanLevel;
  };

  const hasFeature = (feature: string) => {
    return isValid && features.includes(feature);
  };

  const canAccess = (requiredPlan?: string, requiredFeature?: string) => {
    if (!isValid) return false;
    
    if (requiredPlan && !hasPlan(requiredPlan)) return false;
    if (requiredFeature && !hasFeature(requiredFeature)) return false;
    
    return true;
  };

  return {
    hasPlan,
    hasFeature,
    canAccess,
    isValid,
    plan,
    features
  };
};

export default LicenseGuard;
