// UMaT (University of Mines and Technology, Tarkwa) — Official Faculties, Programmes & Hostels

export const FACULTIES = [
  {
    name: 'Faculty of Mining and Minerals Technology (FMMT)',
    short: 'FMMT',
    programmes: [
      'BSc Mining Engineering',
      'BSc Minerals Engineering',
    ],
  },
  {
    name: 'Faculty of Geosciences and Environmental Studies (FGES)',
    short: 'FGES',
    programmes: [
      'BSc Geological Engineering',
      'BSc Geomatic Engineering',
      'BSc Environmental and Safety Engineering',
    ],
  },
  {
    name: 'Faculty of Engineering (FoE)',
    short: 'FoE',
    programmes: [
      'BSc Mechanical Engineering',
      'BSc Electrical and Electronic Engineering',
      'BSc Renewable Energy Engineering',
    ],
  },
  {
    name: 'Faculty of Computing and Mathematical Sciences (FCaMS)',
    short: 'FCaMS',
    programmes: [
      'BSc Computer Science and Engineering',
      'BSc Cyber Security',
      'BSc Information Systems',
      'BSc Mathematics',
      'BSc Statistical Data Science',
    ],
  },
  {
    name: 'School of Petroleum Studies (SPetS)',
    short: 'SPetS',
    programmes: [
      'BSc Petroleum Engineering',
      'BSc Natural Gas Engineering',
      'BSc Petroleum Geosciences and Engineering',
      'BSc Petroleum Refining and Petrochemical Engineering',
    ],
  },
  {
    name: 'Faculty of Integrated Management Science (FIMS)',
    short: 'FIMS',
    programmes: [
      'BSc Logistics and Transport Management',
      'BSc Economics and Industrial Organization',
      'BSc Land Administration and Information Systems',
    ],
  },
  {
    name: 'School of Railways and Infrastructure Development (SRID)',
    short: 'SRID',
    programmes: [
      'BSc Civil Engineering',
      'BSc Mechanical Engineering (Railway)',
      'BSc Electrical and Electronic Engineering (Railway)',
      'BSc Geomatic Engineering (Railway)',
      'BSc Computer Science and Engineering (Railway)',
    ],
  },
  {
    name: 'Diploma & Certificate Programs',
    short: 'Diploma/Cert',
    programmes: [
      'Diploma: General Drilling',
      'Certificate: Occupational Health and Safety',
      'Certificate: Surface and Underground Mining',
      'Certificate: Minerals Technology',
    ],
  },
]

export const HOSTELS = {
  main: [
    'Chamber of Mines Hall',
    'Gold Refinery Hall (Gold Hall)',
    'K.T. Hall (Kwatabisa Hall)',
  ],
  private: [
    'Dubai Hostel',
    'Hilda Hostel',
    'Credit Union Hostel',
    'Swag Mansion Hostel',
    'Osborn Hostel',
    'Oak Hostel',
    'Fijenco Hostel',
    'Waterloo Hostel',
    'Floger Hostel',
  ],
  other: ['Off-Campus / Rented Room', 'Other'],
}

export const CLASS_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate', 'PhD']

// Flat list of all programmes (useful for search/filter)
export const ALL_PROGRAMMES = FACULTIES.flatMap(f => f.programmes)
