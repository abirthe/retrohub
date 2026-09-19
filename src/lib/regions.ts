// Region definitions and labels
// All available regions for products

export const REGIONS = {
  GLOBAL: { code: 'GLOBAL', label: '🌍 Global', flag: '🌍' },
  US: { code: 'US', label: '🇺🇸 United States', flag: '🇺🇸' },
  EU: { code: 'EU', label: '🇪🇺 Europe', flag: '🇪🇺' },
  UK: { code: 'UK', label: '🇬🇧 United Kingdom', flag: '🇬🇧' },
  ASIA: { code: 'ASIA', label: '🌏 Asia', flag: '🌏' },
  LATAM: { code: 'LATAM', label: '🌎 Latin America', flag: '🌎' },
  CA: { code: 'CA', label: '🇨🇦 Canada', flag: '🇨🇦' },
  MX: { code: 'MX', label: '🇲🇽 Mexico', flag: '🇲🇽' },
  BR: { code: 'BR', label: '🇧🇷 Brazil', flag: '🇧🇷' },
  IN: { code: 'IN', label: '🇮🇳 India', flag: '🇮🇳' },
  CN: { code: 'CN', label: '🇨🇳 China', flag: '🇨🇳' },
  JP: { code: 'JP', label: '🇯🇵 Japan', flag: '🇯🇵' },
  KR: { code: 'KR', label: '🇰🇷 South Korea', flag: '🇰🇷' },
  AU: { code: 'AU', label: '🇦🇺 Australia', flag: '🇦🇺' },
  NZ: { code: 'NZ', label: '🇳🇿 New Zealand', flag: '🇳🇿' },
  ME: { code: 'ME', label: '🌍 Middle East', flag: '🌍' },
  AFRICA: { code: 'AFRICA', label: '🌍 Africa', flag: '🌍' },
  OCEANIA: { code: 'OCEANIA', label: '🌏 Oceania', flag: '🌏' },
  AE: { code: 'AE', label: '🇦🇪 UAE', flag: '🇦🇪' },
  SA: { code: 'SA', label: '🇸🇦 Saudi Arabia', flag: '🇸🇦' },
  ZA: { code: 'ZA', label: '🇿🇦 South Africa', flag: '🇿🇦' },
  RU: { code: 'RU', label: '🇷🇺 Russia', flag: '🇷🇺' },
  TR: { code: 'TR', label: '🇹🇷 Turkey', flag: '🇹🇷' },
  SG: { code: 'SG', label: '🇸🇬 Singapore', flag: '🇸🇬' },
  MY: { code: 'MY', label: '🇲🇾 Malaysia', flag: '🇲🇾' },
  TH: { code: 'TH', label: '🇹🇭 Thailand', flag: '🇹🇭' },
  ID: { code: 'ID', label: '🇮🇩 Indonesia', flag: '🇮🇩' },
  PH: { code: 'PH', label: '🇵🇭 Philippines', flag: '🇵🇭' },
  VN: { code: 'VN', label: '🇻🇳 Vietnam', flag: '🇻🇳' },
  AR: { code: 'AR', label: '🇦🇷 Argentina', flag: '🇦🇷' },
  CO: { code: 'CO', label: '🇨🇴 Colombia', flag: '🇨🇴' },
  CL: { code: 'CL', label: '🇨🇱 Chile', flag: '🇨🇱' },
  PE: { code: 'PE', label: '🇵🇪 Peru', flag: '🇵🇪' },
  EG: { code: 'EG', label: '🇪🇬 Egypt', flag: '🇪🇬' },
  NG: { code: 'NG', label: '🇳🇬 Nigeria', flag: '🇳🇬' },
  PK: { code: 'PK', label: '🇵🇰 Pakistan', flag: '🇵🇰' },
  BD: { code: 'BD', label: '🇧🇩 Bangladesh', flag: '🇧🇩' },
} as const;

export type RegionCode = keyof typeof REGIONS;

export function getRegionLabel(code: string): string {
  return REGIONS[code as RegionCode]?.label || code;
}

export function getRegionFlag(code: string): string {
  return REGIONS[code as RegionCode]?.flag || '🌍';
}

export const ALL_REGIONS = Object.values(REGIONS);

