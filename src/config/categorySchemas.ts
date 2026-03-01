export type FieldType = 'text' | 'select' | 'checkbox' | 'date';

export interface CategoryField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  condition?: {
    dependsOnId: string;
    expectedValue: unknown;
  };
}

/** Exact keys for tab-specific categories - used for data segregation */
export const ZABIT_CATEGORY = 'Zabıt İzleme' as const;
export const TEBLIGAT_CATEGORY = 'Tebligat Takip' as const;
export const KENTSEL_CATEGORY = 'Kentsel Dönüşüm' as const;

export const CATEGORY_SCHEMAS: Record<string, CategoryField[]> = {
  Şikayet: [
    { id: 'kaynak', label: 'Şikayet Kaynağı', type: 'select', options: ['EBYS', 'Ulakbel'] }
  ],
  Hafriyat: [
    { id: 'iksa_durumu', label: 'İksa Durumu', type: 'select', options: ['İksa önlemi var', 'İksa önlemi yok'] },
    { id: 'izin_durumu', label: 'İzin Durumu', type: 'select', options: ['Tam izin', 'Süreli izin'] }
  ],
  [ZABIT_CATEGORY]: [
    { id: 'zabit_tarihi', label: 'Zabıt Tarihi', type: 'date' },
    { id: 'encumen_havale', label: 'Encümen Havale', type: 'checkbox' },
    {
      id: 'aykirilik_giderildi_mi',
      label: 'Aykırılık Giderildi mi?',
      type: 'select',
      options: ['Seçiniz', 'Evet', 'Hayır']
    },
    {
      id: 'hukuk_184_yazisi',
      label: 'Hukuk İşlerine 184 Yazısı',
      type: 'checkbox',
      condition: { dependsOnId: 'aykirilik_giderildi_mi', expectedValue: 'Hayır' }
    }
  ],
  [TEBLIGAT_CATEGORY]: [
    { id: 'madde_39', label: '39. Madde', type: 'checkbox' },
    { id: 'emniyet_tedbiri', label: 'Emniyet Tedbiri', type: 'checkbox' },
    { id: 'teblig_tarihi', label: 'Tebliğ Tarihi', type: 'date' },
    { id: 'teblig_sure_sonu', label: 'Tebliğ Süre Sonu', type: 'date' }
  ],
  [KENTSEL_CATEGORY]: [
    { id: 'riskli_yapi_karari', label: 'Riskli Yapı Kararı', type: 'checkbox' },
    { id: 'karar_tarihi', label: 'Karar Tarihi', type: 'date' },
    { id: 'tahliye_durumu', label: 'Tahliye Durumu', type: 'select', options: ['Bekliyor', 'Tamamlandı'] }
  ]
};
