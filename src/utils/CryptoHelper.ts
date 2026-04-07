// Utilitários de criptografia
import CryptoJS from 'crypto-js';

export class CryptoHelper {
  // Gerar hash SHA-256
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  // Gerar hash SHA-512
  static hash512(data: string): string {
    return CryptoJS.SHA512(data).toString();
  }

  // Gerar hash MD5 (apenas para compatibilidade)
  static md5(data: string): string {
    return CryptoJS.MD5(data).toString();
  }

  // Encriptar dados com AES
  static encrypt(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  // Desencriptar dados com AES
  static decrypt(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Gerar chave de licença
  static generateLicenseKey(plan: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const data = `${plan}-${ts}-${random}`;
    const hash = this.hash(data).substring(0, 4).toUpperCase();
    
    return `ALMX-${plan.toUpperCase()}-${ts.toString(36).toUpperCase()}-${hash}`;
  }

  // Gerar chave perpétua
  static generatePerpetualKey(type: 'CLOUD' | 'LOCAL', timestamp?: number): string {
    const ts = timestamp || Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const data = `PERPETUAL-${type}-${ts}-${random}`;
    const hash = this.hash(data).substring(0, 4).toUpperCase();
    
    return `ALMX-PERPETUAL-${type}-${ts.toString(36).toUpperCase()}-${hash}`;
  }

  // Validar formato da chave
  static validateLicenseKey(key: string): boolean {
    // Formato: ALMX-XXXXX-XXXX ou ALMX-PERPETUAL-TYPE-XXXXX-XXXX
    const perpetualPattern = /^ALMX-PERPETUAL-(CLOUD|LOCAL)-[A-Z0-9]+-[A-Z0-9]+$/;
    const regularPattern = /^ALMX-[A-Z0-9]+-[A-Z0-9]+$/;
    
    return perpetualPattern.test(key) || regularPattern.test(key);
  }

  // Extrair informações da chave
  static parseLicenseKey(key: string): {
    type: 'perpetual' | 'regular';
    plan?: string;
    perpetualType?: 'CLOUD' | 'LOCAL';
    timestamp?: string;
    checksum?: string;
  } {
    const perpetualMatch = key.match(/^ALMX-PERPETUAL-(CLOUD|LOCAL)-([A-Z0-9]+)-([A-Z0-9]+)$/);
    const regularMatch = key.match(/^ALMX-([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)$/);

    if (perpetualMatch) {
      return {
        type: 'perpetual',
        perpetualType: perpetualMatch[1] as 'CLOUD' | 'LOCAL',
        timestamp: perpetualMatch[2],
        checksum: perpetualMatch[3]
      };
    }

    if (regularMatch) {
      return {
        type: 'regular',
        plan: regularMatch[1],
        timestamp: regularMatch[2],
        checksum: regularMatch[3]
      };
    }

    return { type: 'regular' };
  }

  // Verificar checksum da chave
  static verifyChecksum(key: string): boolean {
    const parsed = this.parseLicenseKey(key);
    
    if (parsed.type === 'perpetual') {
      const expectedData = `PERPETUAL-${parsed.perpetualType}-${parsed.timestamp}`;
      const expectedHash = this.hash(expectedData).substring(0, 4).toUpperCase();
      return parsed.checksum === expectedHash;
    }

    if (parsed.type === 'regular' && parsed.plan && parsed.timestamp) {
      const expectedData = `${parsed.plan}-${parsed.timestamp}`;
      const expectedHash = this.hash(expectedData).substring(0, 4).toUpperCase();
      return parsed.checksum === expectedHash;
    }

    return false;
  }

  // Gerar token seguro
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Gerar salt para senhas
  static generateSalt(length: number = 16): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  // Hash de senha com salt
  static hashPassword(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();
  }

  // Gerar UUID
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Codificar Base64
  static base64Encode(data: string): string {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
  }

  // Decodificar Base64
  static base64Decode(data: string): string {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(data));
  }

  // Gerar HMAC
  static hmac(data: string, key: string): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  // Gerar timestamp seguro
  static secureTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Comparar strings de forma segura
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Gerar fingerprint de dados
  static fingerprint(data: any): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return this.hash(dataString);
  }

  // Obter versão da CryptoJS
  static getVersion(): string {
    return CryptoJS.version || 'Unknown';
  }
}
