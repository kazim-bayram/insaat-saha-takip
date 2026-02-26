export type FieldType = 'text' | 'select' | 'checkbox' | 'date';

export interface CategoryField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  condition?: {
    dependsOnId: string;
    expectedValue: any;
  };
}

export const CATEGORY_SCHEMAS: Record<string, CategoryField[]> = {
  Şikayet: [
    {
      id: 'kaynak',
      label: 'Şikayet Kaynağı',
      type: 'select',
      options: ['EBYS', 'Ulakbel']
    }
  ],
  Hafriyat: [
    {
      id: 'iksa_durumu',
      label: 'İksa Durumu',
      type: 'select',
      options: ['İksa önlemi var', 'İksa önlemi yok']
    },
    {
      id: 'izin_durumu',
      label: 'İzin Durumu',
      type: 'select',
      options: ['Tam izin', 'Süreli izin']
    }
  ],
  Tebligat: [
    {
      id: 'madde_39',
      label: '39. Madde',
      type: 'checkbox'
    },
    {
      id: 'emniyet_tedbiri',
      label: 'Emniyet Tedbiri',
      type: 'checkbox'
    },
    {
      id: 'teblig_tarihi',
      label: 'Tebliğ Tarihi',
      type: 'date'
    },
    {
      id: 'teblig_sure_sonu',
      label: 'Tebliğ Süre Sonu',
      type: 'date'
    }
  ],
  Zabıt: [
    {
      id: 'zabit_tarihi',
      label: 'Zabıt Tarihi',
      type: 'date'
    },
    {
      id: 'encumen_havale',
      label: 'Encümen Havale',
      type: 'checkbox'
    },
    {
      id: 'aykirilik_giderildi_mi',
      label: 'Aykırılık Giderildi mi?',
      type: 'select',
      options: ['Seçiniz...', 'Evet', 'Hayır']
    },
    {
      id: 'hukuk_184_yazisi',
      label: 'Hukuk İşlerine 184 Yazısı',
      type: 'checkbox',
      condition: {
        dependsOnId: 'aykirilik_giderildi_mi',
        expectedValue: 'Hayır'
      }
    }
  ]
};

