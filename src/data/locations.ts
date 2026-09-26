import { Location } from '@/types/location';

// چندتا مکان نمونه برای شروع
// بعداً می‌تونی مکان‌های واقعی دانشگاهت رو اینجا بذاری
export const campusLocations: Location[] = [

  // ... بقیه داده‌ها همونطور که هستن

  {
    id: '1',
    name: 'ساختمان مرکزی',
    nameEn: 'Main Building',
    category: 'admin',
    lat: 35.7219,
    lng: 51.3347,
    description: 'دفتر ریاست و معاونت‌ها',
    isOpen: true
  },
  {
    id: '2',
    name: 'سلف دانشجویی',
    nameEn: 'Student Cafeteria',
    category: 'food',
    lat: 35.7225,
    lng: 51.3352,
    description: 'سلف اصلی دانشگاه',
    isOpen: true
  },
  {
    id: '3',
    name: 'کتابخانه مرکزی',
    nameEn: 'Central Library',
    category: 'academic',
    lat: 35.7215,
    lng: 51.3340,
    description: 'کتابخانه و سالن مطالعه',
    floor: 2,
    isOpen: true
  },
  {
    id: '4',
    name: 'سالن ورزشی',
    nameEn: 'Sports Hall',
    category: 'sport',
    lat: 35.7230,
    lng: 51.3360,
    description: 'سالن بسکتبال و والیبال',
    isOpen: false
  },
  {
    id: '5',
    name: 'کافه دانشجویی',
    nameEn: 'Student Cafe',
    category: 'food',
    lat: 35.7222,
    lng: 51.3345,
    description: 'کافه و فضای استراحت',
    isOpen: true
  }
];
