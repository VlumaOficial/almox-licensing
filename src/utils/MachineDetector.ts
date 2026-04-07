// Detector de fingerprint de máquina
import CryptoJS from 'crypto-js';

export interface MachineInfo {
  id: string;
  fingerprint: string;
  userAgent: string;
  platform: string;
  cores: number;
  memory: number;
  screen: string;
  timezone: string;
  language: string;
}

export class MachineDetector {
  private static instance: MachineDetector;
  private machineInfo: MachineInfo | null = null;

  private constructor() {
    this.machineInfo = this.generateMachineInfo();
  }

  static getInstance(): MachineDetector {
    if (!MachineDetector.instance) {
      MachineDetector.instance = new MachineDetector();
    }
    return MachineDetector.instance;
  }

  async getMachineId(): Promise<string> {
    if (this.machineInfo) {
      return this.machineInfo.id;
    }

    this.machineInfo = this.generateMachineInfo();
    return this.machineInfo.id;
  }

  async getFingerprint(): Promise<string> {
    if (this.machineInfo) {
      return this.machineInfo.fingerprint;
    }

    this.machineInfo = this.generateMachineInfo();
    return this.machineInfo.fingerprint;
  }

  getMachineInfo(): MachineInfo {
    if (!this.machineInfo) {
      this.machineInfo = this.generateMachineInfo();
    }
    return this.machineInfo;
  }

  private generateMachineInfo(): MachineInfo {
    // Coletar informações do navegador e sistema
    const canvas = this.getCanvasFingerprint();
    const webgl = this.getWebGLFingerprint();
    const fonts = this.getFontFingerprint();
    const audio = this.getAudioFingerprint();

    // Combinar todas as informações
    const fingerprintData = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 1,
      navigator.deviceMemory || 4,
      canvas,
      webgl,
      fonts,
      audio,
      navigator.platform,
      navigator.vendor
    ].join('|');

    // Gerar hash
    const fingerprint = CryptoJS.SHA256(fingerprintData).toString();
    const shortId = fingerprint.substring(0, 16).toUpperCase();

    return {
      id: shortId,
      fingerprint: fingerprint,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 1,
      memory: (navigator.deviceMemory || 4) * 1024, // Converter para MB
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: navigator.language
    };
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';

      // Texto para fingerprint
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('AlmoxPro License Fingerprint', 2, 2);
      
      return canvas.toDataURL().substring(0, 50);
    } catch (error) {
      return '';
    }
  }

  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return '';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : '';
      
      return renderer.substring(0, 50);
    } catch (error) {
      return '';
    }
  }

  private getFontFingerprint(): string {
    try {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';

      const fontString: string[] = [];
      
      testFonts.forEach(font => {
        baseFonts.forEach(baseFont => {
          ctx.font = `12px '${font}', '${baseFont}'`;
          const width = ctx.measureText('mmmmmmmmmmlli').width;
          fontString.push(width.toString());
        });
      });

      return fontString.join('|');
    } catch (error) {
      return '';
    }
  }

  private getAudioFingerprint(): string {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return '';

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      gain.gain.setValueAtTime(0, context.currentTime);

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);

      oscillator.start(0);

      const fingerprint = new Promise<string>((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const data = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum += Math.abs(data[i]);
          }
          
          oscillator.stop();
          context.close();
          
          resolve(sum.toString().substring(0, 20));
        };
      });

      return fingerprint.toString().substring(0, 20);
    } catch (error) {
      return '';
    }
  }

  // Verificar se a máquina mudou
  async hasMachineChanged(): Promise<boolean> {
    const currentMachine = await this.getMachineId();
    const savedMachine = localStorage.getItem('almox_machine_id');
    
    if (!savedMachine) {
      localStorage.setItem('almox_machine_id', currentMachine);
      return false;
    }

    return currentMachine !== savedMachine;
  }

  // Salvar ID da máquina atual
  async saveMachineId(): Promise<void> {
    const machineId = await this.getMachineId();
    localStorage.setItem('almox_machine_id', machineId);
  }

  // Limpar ID da máquina
  clearMachineId(): void {
    localStorage.removeItem('almox_machine_id');
  }

  // Obter informações detalhadas para debug
  getDetailedInfo(): object {
    return {
      machineId: this.machineInfo?.id,
      fingerprint: this.machineInfo?.fingerprint,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      vendor: navigator.vendor,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      },
      timezone: {
        offset: new Date().getTimezoneOffset(),
        name: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,
      plugins: this.getPluginInfo(),
      fonts: this.getFontList()
    };
  }

  private getPluginInfo(): string[] {
    try {
      const plugins: string[] = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        if (plugin && plugin.name) {
          plugins.push(plugin.name);
        }
      }
      return plugins;
    } catch (error) {
      return [];
    }
  }

  private getFontList(): string[] {
    try {
      const testDiv = document.createElement('div');
      testDiv.style.position = 'absolute';
      testDiv.style.top = '-9999px';
      testDiv.style.left = '-9999px';
      testDiv.style.visibility = 'hidden';
      testDiv.style.fontSize = '72px';
      testDiv.style.lineHeight = 'normal';
      testDiv.innerHTML = 'mmmmmmmmmmlli';

      document.body.appendChild(testDiv);

      const defaultWidth = testDiv.offsetWidth;
      const fonts = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
        'Avant Garde', 'Calibri', 'Cambria', 'Candara',
        'Century Gothic', 'Comic Sans MS', 'Consolas', 'Courier',
        'Courier New', 'Geneva', 'Georgia', 'Helvetica',
        'Impact', 'Lucida Console', 'Lucida Sans Unicode',
        'Microsoft Sans Serif', 'Monaco', 'Palatino', 'Tahoma',
        'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'
      ];

      const detectedFonts: string[] = [];
      fonts.forEach(font => {
        testDiv.style.fontFamily = `'${font}', monospace`;
        const width = testDiv.offsetWidth;
        if (width !== defaultWidth) {
          detectedFonts.push(font);
        }
      });

      document.body.removeChild(testDiv);
      return detectedFonts;
    } catch (error) {
      return [];
    }
  }

  // Gerar hash simples para compatibilidade
  static generateSimpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
