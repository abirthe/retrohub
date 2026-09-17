# Available Regions - RETROHUB

Complete list of all available regions for products in the RETROHUB platform.

## 🌍 All Regions

### Global & Continental
- **GLOBAL** - 🌍 Global (works worldwide)
- **EU** - 🇪🇺 Europe
- **ASIA** - 🌏 Asia (general)
- **LATAM** - 🌎 Latin America
- **AFRICA** - 🌍 Africa
- **OCEANIA** - 🌏 Oceania
- **ME** - 🌍 Middle East

### North America
- **US** - 🇺🇸 United States
- **CA** - 🇨🇦 Canada
- **MX** - 🇲🇽 Mexico

### Europe
- **UK** - 🇬🇧 United Kingdom
- **RU** - 🇷🇺 Russia
- **TR** - 🇹🇷 Turkey

### Asia Pacific
- **IN** - 🇮🇳 India
- **CN** - 🇨🇳 China
- **JP** - 🇯🇵 Japan
- **KR** - 🇰🇷 South Korea
- **SG** - 🇸🇬 Singapore
- **MY** - 🇲🇾 Malaysia
- **TH** - 🇹🇭 Thailand
- **ID** - 🇮🇩 Indonesia
- **PH** - 🇵🇭 Philippines
- **VN** - 🇻🇳 Vietnam

### Middle East
- **AE** - 🇦🇪 UAE (United Arab Emirates)
- **SA** - 🇸🇦 Saudi Arabia

### Latin America
- **BR** - 🇧🇷 Brazil

### Oceania
- **AU** - 🇦🇺 Australia
- **NZ** - 🇳🇿 New Zealand

### Africa
- **ZA** - 🇿🇦 South Africa

## 📝 Usage

### In Database (SQL)
```sql
-- When creating a product, use the region code:
INSERT INTO products (title, category, region, ...)
VALUES ('Product Name', 'giftcard', 'US', ...);

-- Available values:
'GLOBAL', 'US', 'EU', 'UK', 'ASIA', 'LATAM', 'CA', 'MX', 'BR', 
'IN', 'CN', 'JP', 'KR', 'AU', 'NZ', 'ME', 'AFRICA', 'OCEANIA', 
'AE', 'SA', 'ZA', 'RU', 'TR', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN'
```

### In Frontend (TypeScript)
```typescript
import { getRegionLabel, REGIONS } from '@/lib/regions';

// Get human-readable label
const label = getRegionLabel('US'); // Returns: "🇺🇸 United States"

// Access all regions
const allRegions = Object.values(REGIONS);
```

## 🎯 Best Practices

1. **Use GLOBAL** for products that work worldwide
2. **Use specific codes** (US, UK, etc.) for region-locked products
3. **Use continental codes** (EU, ASIA) for multi-country products
4. **Display with flags** for better user experience

## 📊 Region Statistics

Total Regions Available: **28**

- Global: 1
- North America: 3
- Europe: 3
- Asia Pacific: 10
- Middle East: 3
- Latin America: 2
- Oceania: 2
- Africa: 1
- Continental: 3

---

**Dev by ABIR HOSSAIN**

