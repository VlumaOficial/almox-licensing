import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto-js';

// Geração de ID único de instalação
export function generateInstallationId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const hardware = getHardwareId();
  return `ALX_${timestamp}_${random}_${hardware}`;
}

// Geração de chave de licença
export function generateLicenseKey(): string {
  const prefix = 'LIC';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  const checksum = generateChecksum(`${prefix}${timestamp}${random}`);
  return `${prefix}_${timestamp}_${random}_${checksum}`;
}

// Geração de chave de trial
export function generateTrialLicenseKey(): string {
  const prefix = 'TRIAL';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  const checksum = generateChecksum(`${prefix}${timestamp}${random}`);
  return `${prefix}_${timestamp}_${random}_${checksum}`;
}

// Geração de checksum simples
export function generateChecksum(data: string): string {
  return crypto.SHA256(data).toString().substring(0, 8).toUpperCase();
}

// Obter ID do hardware (simplificado)
export function getHardwareId(): string {
  try {
    const os = require('os');
    const cpu = os.cpus()[0]?.model || 'unknown';
    const hostname = os.hostname() || 'unknown';
    const platform = os.platform() || 'unknown';
    const arch = os.arch() || 'unknown';
    
    const combined = `${cpu}_${hostname}_${platform}_${arch}`;
    return crypto.SHA256(combined).toString().substring(0, 12);
  } catch (error) {
    // Fallback para ambiente onde os não está disponível
    return crypto.SHA256('fallback_hardware').toString().substring(0, 12);
  }
}

// Cálculo de data de expiração
export function calculateExpiryDate(licenseType: string, durationDays: number): string {
  if (durationDays === -1) {
    // Licença vitalícia - expira em 100 anos
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 100);
    return expiry.toISOString();
  }
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry.toISOString();
}

// Calcular dias restantes
export function calculateDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Verificar se está expirando em breve (7 dias)
export function isExpiringSoon(expiresAt: string): boolean {
  return calculateDaysRemaining(expiresAt) <= 7;
}

// Formatar data para exibição
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatar tipo de licença para exibição
export function formatLicenseType(type: string): string {
  const typeMap: Record<string, string> = {
    'monthly': 'Mensal',
    'monthly_recurring': 'Mensal Recorrente',
    'quarterly': 'Trimestral',
    'semiannual': 'Semestral',
    'annual': 'Anual',
    'lifetime': 'Vitalícia',
    'trial': 'Trial'
  };
  
  return typeMap[type] || type;
}

// Formatar status para exibição
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'Ativa',
    'expired': 'Expirada',
    'trial': 'Trial',
    'suspended': 'Suspensa',
    'deleted': 'Excluída',
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'cancelled': 'Cancelado'
  };
  
  return statusMap[status] || status;
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar telefone (brasileiro)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Sanitizar string para uso em IDs
export function sanitizeForId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Gerar string aleatória
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Extrair email do external_reference
export function extractEmailFromReference(reference: string): string {
  // Formato esperado: license_planid_installationid_email
  const parts = reference.split('_');
  return parts[parts.length - 1] || '';
}

// Calcular hash para segurança
export function calculateHash(data: string): string {
  return crypto.SHA256(data).toString();
}

// Verificar integridade dos dados
export function verifyDataIntegrity(data: any, expectedHash: string): boolean {
  const calculatedHash = calculateHash(JSON.stringify(data));
  return calculatedHash === expectedHash;
}

// Gerar timestamp único
export function generateUniqueTimestamp(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Formatar valor monetário
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Calcular porcentagem
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Limitar string com ellipsis
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Gerar cor baseada em string (para UI)
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Verificar se é ambiente de desenvolvimento
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.VERCEL_ENV === 'preview' ||
         process.env.VERCEL_ENV === 'development';
}

// Verificar se é ambiente de produção
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && 
         process.env.VERCEL_ENV === 'production';
}

// Log estruturado
export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    environment: process.env.NODE_ENV || 'unknown'
  };
  
  console.log(JSON.stringify(logEntry, null, 2));
}
