// Mock data for Campus Connect Marketplace
// Images: stored locally in /public/images/

export interface Good {
  id: string
  name: string
  price: number
  condition: 'New' | 'Like New' | 'Good' | 'Fair'
  category: 'Electronics' | 'Clothing' | 'Books' | 'Furniture' | 'Sports' | 'Other'
  seller: string
  sellerId?: string
  sellerImage: string
  sellerRating: number
  sellerVerified?: boolean
  image: string
  description: string
  createdAt: string
  views: number
}

export interface Service {
  id: string
  name: string
  provider: string
  providerId?: string
  providerImage: string
  providerRating: number
  providerVerified?: boolean
  category: 'Barbing' | 'Tutoring' | 'Photography' | 'Laundry' | 'Tech Repair' | 'Design' | 'Other'
  rate: string
  description: string
  availability: string
  image: string
  responseTime: string
  bookings: number
}

const AVATARS = {
  kwame:  '/images/avatars/kwame.jpg',
  ama:    '/images/avatars/ama.jpg',
  yaw:    '/images/avatars/yaw.jpg',
  abena:  '/images/avatars/abena.jpg',
  kofi:   '/images/avatars/kofi.jpg',
  nana:   '/images/avatars/nana.jpg',
  akua:   '/images/avatars/akua.jpg',
  kojo:   '/images/avatars/kojo.jpg',
}

export const mockGoods: Good[] = [
  {
    id: 'good-1',
    name: 'Dell Laptop — XPS 13',
    price: 1200,
    condition: 'Like New',
    category: 'Electronics',
    seller: 'Kwame K.',
    sellerImage: AVATARS.kwame,
    sellerRating: 4.8,
    sellerVerified: false,
    image: '/images/goods/laptop.jpg',
    description: 'Barely used Dell XPS 13 laptop. Core i7, 16GB RAM, 512GB SSD. Original box and charger included. Selling because I upgraded.',
    createdAt: '2 days ago',
    views: 45,
  },
  {
    id: 'good-2',
    name: 'Vintage Denim Jacket',
    price: 150,
    condition: 'Good',
    category: 'Clothing',
    seller: 'Ama S.',
    sellerImage: AVATARS.ama,
    sellerRating: 4.5,
    sellerVerified: false,
    image: '/images/goods/denim-jacket.jpg',
    description: 'Classic blue denim jacket in good condition. Size M. Minor wear on cuffs but still looks great for campus life.',
    createdAt: '5 days ago',
    views: 32,
  },
  {
    id: 'good-3',
    name: 'Organic Chemistry Textbook',
    price: 45,
    condition: 'Good',
    category: 'Books',
    seller: 'Yaw M.',
    sellerImage: AVATARS.yaw,
    sellerRating: 4.9,
    sellerVerified: false,
    image: '/images/goods/textbook.jpg',
    description: 'Morrison & Boyd Organic Chemistry (7th edition). Some highlighting in chapters 1–5. Perfect for 2nd year students.',
    createdAt: '1 week ago',
    views: 28,
  },
  {
    id: 'good-4',
    name: 'Ergonomic Office Chair',
    price: 280,
    condition: 'Like New',
    category: 'Furniture',
    seller: 'Abena K.',
    sellerImage: AVATARS.abena,
    sellerRating: 4.7,
    sellerVerified: false,
    image: '/images/goods/office-chair.jpg',
    description: 'Comfortable ergonomic chair. Adjustable height and armrests. Perfect for long study sessions. Barely used.',
    createdAt: '3 days ago',
    views: 67,
  },
  {
    id: 'good-5',
    name: 'Wilson Basketball (Official)',
    price: 85,
    condition: 'New',
    category: 'Sports',
    seller: 'Kofi J.',
    sellerImage: AVATARS.kofi,
    sellerRating: 4.6,
    sellerVerified: false,
    image: '/images/goods/basketball.jpg',
    description: 'Brand new official Wilson basketball. Never used. Still in packaging. Bought as a gift but already have one.',
    createdAt: '4 days ago',
    views: 52,
  },
  {
    id: 'good-6',
    name: 'Sony WH-1000XM4 Headphones',
    price: 220,
    condition: 'Like New',
    category: 'Electronics',
    seller: 'Nana O.',
    sellerImage: AVATARS.nana,
    sellerRating: 4.9,
    sellerVerified: false,
    image: '/images/goods/headphones.jpg',
    description: 'Sony wireless noise-cancelling headphones. Excellent condition with original case and all accessories.',
    createdAt: '1 day ago',
    views: 89,
  },
  {
    id: 'good-7',
    name: 'Scientific Calculator (Casio)',
    price: 60,
    condition: 'Good',
    category: 'Electronics',
    seller: 'Akua A.',
    sellerImage: AVATARS.akua,
    sellerRating: 4.7,
    sellerVerified: false,
    image: '/images/goods/calculator.jpg',
    description: 'Casio FX-991EX ClassWiz scientific calculator. All functions working. Minor scratches on back.',
    createdAt: '6 days ago',
    views: 41,
  },
  {
    id: 'good-8',
    name: 'Engineering Drawing Set',
    price: 35,
    condition: 'Good',
    category: 'Other',
    seller: 'Kojo A.',
    sellerImage: AVATARS.kojo,
    sellerRating: 4.8,
    sellerVerified: false,
    image: '/images/goods/drawing-set.jpg',
    description: 'Complete engineering drawing set — T-square, set squares, compass, scale rule. Good condition for 1st year students.',
    createdAt: '2 weeks ago',
    views: 33,
  },
]

export const mockServices: Service[] = [
  {
    id: 'service-1',
    name: 'Professional Haircut & Barbing',
    provider: "Kojo's Barber Studio",
    providerImage: AVATARS.kojo,
    providerRating: 4.9,
    providerVerified: false,
    category: 'Barbing',
    rate: 'GHS 30–50',
    description: 'Professional haircut with fade, lineup, and styling. Walk-ins welcome. Studio located near the SRC building. Low cut, afro, twist — all styles done.',
    availability: 'Mon–Sat, 9AM–6PM',
    image: '/images/services/barbing.jpg',
    responseTime: '< 1 hour',
    bookings: 234,
  },
  {
    id: 'service-2',
    name: 'Mathematics & Physics Tutoring',
    provider: 'Akosua M.',
    providerImage: AVATARS.ama,
    providerRating: 4.8,
    providerVerified: false,
    category: 'Tutoring',
    rate: 'GHS 80–120/hr',
    description: '3rd year Mining Engineering student offering tutoring in Mathematics, Physics, and Statics. Exam prep and assignment help. In-person or online.',
    availability: 'Flexible — book 24hrs ahead',
    image: '/images/services/tutoring.jpg',
    responseTime: '< 2 hours',
    bookings: 178,
  },
  {
    id: 'service-3',
    name: 'Professional Event Photography',
    provider: "Ade's Photo Studio",
    providerImage: AVATARS.kofi,
    providerRating: 4.7,
    providerVerified: false,
    category: 'Photography',
    rate: 'GHS 500–2,000',
    description: 'Professional photography for events, graduation portraits, and campus activities. Quick 48hr turnaround on edited photos. Portfolio available on request.',
    availability: 'Weekends & Evenings',
    image: '/images/services/photography.jpg',
    responseTime: '< 3 hours',
    bookings: 92,
  },
  {
    id: 'service-4',
    name: 'Laundry & Dry Cleaning',
    provider: 'Fresh Wash Services',
    providerImage: AVATARS.abena,
    providerRating: 4.6,
    providerVerified: false,
    category: 'Laundry',
    rate: 'GHS 5–15/item',
    description: 'Fast, reliable laundry service. Free pickup and delivery within campus hostels. Same-day service available for urgent orders. Clothes returned neatly folded.',
    availability: '24/7 — we collect anytime',
    image: '/images/services/laundry.jpg',
    responseTime: 'Same day',
    bookings: 412,
  },
  {
    id: 'service-5',
    name: 'Phone & Laptop Repair',
    provider: 'TechFix Hub UMaT',
    providerImage: AVATARS.kwame,
    providerRating: 4.8,
    providerVerified: false,
    category: 'Tech Repair',
    rate: 'Varies by repair',
    description: 'Expert repair for phones, laptops, and tablets. Screen replacements, battery swaps, software issues, virus removal. Genuine parts. 1-month warranty on all repairs.',
    availability: 'Daily 10AM–8PM',
    image: '/images/services/tech-repair.jpg',
    responseTime: 'Same day or next day',
    bookings: 187,
  },
  {
    id: 'service-6',
    name: 'Graphic Design & Logo Creation',
    provider: 'Yaa Creative Studio',
    providerImage: AVATARS.nana,
    providerRating: 4.9,
    providerVerified: false,
    category: 'Design',
    rate: 'GHS 150–1,500',
    description: 'Professional graphic design for logos, flyers, social media graphics, and presentations. Fast revisions. Unlimited concepts until you are satisfied.',
    availability: 'Anytime — online delivery',
    image: '/images/services/design.jpg',
    responseTime: '< 4 hours',
    bookings: 156,
  },
]
