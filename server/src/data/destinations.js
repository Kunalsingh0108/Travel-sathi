/**
 * Curated sample destination dataset.
 *
 * This is hand-maintained sample data for the project's itinerary engine.
 * Coordinates are approximate public landmarks, costs and opening hours are
 * UNVERIFIED ESTIMATES - the UI labels them as such and users are told that
 * nothing here is fetched live from an official source.
 *
 * Attraction fields:
 *   id, name, category, lat, lng, description, durationMin,
 *   hours {open, close} | null, closedDays [weekday index], costPerPerson,
 *   popularity 1-5, tags [interest keys], dataStatus, optional note
 */

const CAT = ['nature', 'history', 'adventure', 'shopping', 'food', 'beaches', 'culture', 'relaxation'];

export const INTERESTS = CAT;

export const DESTINATIONS = [
  {
    id: 'goa',
    name: 'Goa',
    region: 'Goa, India',
    lat: 15.4909,
    lng: 73.8278,
    blurb: 'Golden beaches, Portuguese-era churches and long lazy evenings.',
    bestSeason: 'November to February',
    costs: { perNight: 3400, foodPerDay: 1300 },
    attractions: [
      {
        id: 'goa-calangute', name: 'Calangute Beach', category: 'beaches',
        lat: 15.5439, lng: 73.7560, district: 'Calangute',
        description: 'The most popular beach in North Goa, with shacks, water sports and sunset views.',
        durationMin: 120, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 5, tags: ['beaches', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'goa-baga', name: 'Baga Beach', category: 'beaches',
        lat: 15.5570, lng: 73.7510, district: 'Baga',
        description: 'Lively beach known for its nightlife, parasailing and beachside cafes.',
        durationMin: 120, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 5, tags: ['beaches', 'food'], dataStatus: 'sample',
      },
      {
        id: 'goa-basilica', name: 'Basilica of Bom Jesus', category: 'history',
        lat: 15.5009, lng: 74.0780, district: 'Old Goa',
        description: 'UNESCO World Heritage church holding the mortal remains of St. Francis Xavier.',
        durationMin: 75, hours: { open: '09:00', close: '18:00' }, closedDays: [],
        costPerPerson: 0, popularity: 5, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'goa-se-cathedral', name: 'Se Cathedral', category: 'history',
        lat: 15.5015, lng: 73.9065, district: 'Old Goa',
        description: 'One of the largest churches in Asia, with a famous golden altarpiece.',
        durationMin: 60, hours: { open: '09:30', close: '18:30' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'goa-dudhsagar', name: 'Dudhsagar Falls', category: 'nature',
        lat: 15.3144, lng: 74.3143, district: 'South Goa',
        description: 'A four-tiered 310 m waterfall on the Goa-Karnataka border, reached by jeep.',
        durationMin: 210, hours: { open: '08:00', close: '17:00' }, closedDays: [],
        costPerPerson: 600, popularity: 5, tags: ['nature', 'adventure'],
        note: 'Jeep safari and forest entry fee estimated; access is weather dependent.',
        dataStatus: 'sample',
      },
      {
        id: 'goa-aguada', name: 'Fort Aguada', category: 'history',
        lat: 15.5060, lng: 73.7710, district: 'Sinquerim',
        description: '17th-century sea fort with a lighthouse and wide views over the Arabian Sea.',
        durationMin: 90, hours: { open: '09:00', close: '17:30' }, closedDays: [],
        costPerPerson: 25, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'goa-mapusa-market', name: 'Mapusa Market', category: 'shopping',
        lat: 15.6010, lng: 73.8320, district: 'Mapusa',
        description: 'Busy weekly market for spices, cashews, textiles and local produce.',
        durationMin: 90, hours: { open: '08:00', close: '20:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['shopping', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'goa-chapora', name: 'Chapora Fort', category: 'history',
        lat: 15.6060, lng: 73.7360, district: 'Vagator',
        description: 'Ruined hilltop fort with the classic sunset view over Vagator beach.',
        durationMin: 60, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['history', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'goa-palolem', name: 'Palolem Beach', category: 'beaches',
        lat: 15.5050, lng: 74.0010, district: 'South Goa',
        description: 'A quiet crescent bay with kayaks and calm water, good for a slow afternoon.',
        durationMin: 150, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['beaches', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'goa-salim-ali', name: 'Salim Ali Bird Sanctuary', category: 'nature',
        lat: 15.5260, lng: 73.8700, district: 'Chorao',
        description: 'Mangrove island sanctuary with boardwalks and migratory bird spotting.',
        durationMin: 105, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 30, popularity: 3, tags: ['nature'], dataStatus: 'sample',
      },
    ],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    region: 'Rajasthan, India',
    lat: 26.9124,
    lng: 75.7873,
    blurb: 'The Pink City - hill forts, bazaars and Rajasthani colour.',
    bestSeason: 'October to March',
    costs: { perNight: 3600, foodPerDay: 1400 },
    attractions: [
      {
        id: 'jaipur-amber', name: 'Amber Fort', category: 'history',
        lat: 26.9855, lng: 75.8513, district: 'Amer',
        description: 'Hilltop fort of mirror halls, courtyards and the Sheesh Mahal.',
        durationMin: 180, hours: { open: '08:00', close: '17:30' }, closedDays: [],
        costPerPerson: 500, popularity: 5, tags: ['history', 'culture'],
        note: 'Entry fee estimate for Indians; foreigners pay more.', dataStatus: 'sample',
      },
      {
        id: 'jaipur-hawa-mahal', name: 'Hawa Mahal', category: 'culture',
        lat: 26.9239, lng: 75.8267, district: 'Johari',
        description: 'The five-storey honeycomb facade built for royal women to watch the street.',
        durationMin: 75, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 200, popularity: 5, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-city-palace', name: 'City Palace', category: 'history',
        lat: 26.9239, lng: 75.8240, district: 'Johari',
        description: 'Still-royal palace complex with courtyards, armoury and textile galleries.',
        durationMin: 120, hours: { open: '09:30', close: '17:00' }, closedDays: [],
        costPerPerson: 300, popularity: 5, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-jantar-mantar', name: 'Jantar Mantar', category: 'history',
        lat: 26.9248, lng: 75.8245, district: 'Johari',
        description: 'Astronomical instruments of the 18th century, including the giant sundial.',
        durationMin: 75, hours: { open: '09:00', close: '16:30' }, closedDays: [],
        costPerPerson: 200, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-nahargarh', name: 'Nahargarh Fort', category: 'nature',
        lat: 26.9125, lng: 75.8160, district: 'Aravalli',
        description: 'Ridge-top fort above the city, best at golden hour for panoramic views.',
        durationMin: 90, hours: { open: '10:00', close: '17:30' }, closedDays: [],
        costPerPerson: 200, popularity: 4, tags: ['history', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-jal-mahal', name: 'Jal Mahal (lake view)', category: 'nature',
        lat: 26.9855, lng: 75.8432, district: 'Amber',
        description: 'Palace floating in Man Sagar lake - a short photo stop on the fort road.',
        durationMin: 45, hours: null, hoursNote: 'Exterior viewing, open all day', closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['nature', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-albert-hall', name: 'Albert Hall Museum', category: 'culture',
        lat: 26.9117, lng: 75.8190, district: 'Ram Niwas Bagh',
        description: 'Indo-Saracenic museum of miniature paintings, arms and royal artefacts.',
        durationMin: 90, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 150, popularity: 4, tags: ['culture', 'history'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-johari-bazaar', name: 'Johari Bazaar', category: 'shopping',
        lat: 26.9196, lng: 75.8260, district: 'Johari',
        description: 'Traditional market lane for bangles, bandhani textiles and jewellery.',
        durationMin: 90, hours: { open: '10:00', close: '20:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['shopping', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-birla-mandir', name: 'Birla Mandir', category: 'culture',
        lat: 26.9117, lng: 75.8230, district: 'Jawaharlal Nagar',
        description: 'White marble temple on a hill, calm in the evening light.',
        durationMin: 60, hours: { open: '06:00', close: '20:00' }, closedDays: [],
        costPerPerson: 0, popularity: 3, tags: ['culture', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'jaipur-sisodia', name: 'Sisodia Rani Garden', category: 'nature',
        lat: 26.8650, lng: 75.8260, district: 'Jawaharlal Nagar',
        description: 'Terraced Mughal-style garden with fountains and mural pavilions.',
        durationMin: 60, hours: { open: '08:00', close: '18:00' }, closedDays: [],
        costPerPerson: 30, popularity: 3, tags: ['nature', 'relaxation'], dataStatus: 'sample',
      },
    ],
  },
  {
    id: 'manali',
    name: 'Manali',
    region: 'Himachal Pradesh, India',
    lat: 32.2432,
    lng: 77.1892,
    blurb: 'Pine valleys, apple orchards and mountain passes.',
    bestSeason: 'March to June / December to February',
    costs: { perNight: 3200, foodPerDay: 1200 },
    attractions: [
      {
        id: 'manali-hadimba', name: 'Hadimba Devi Temple', category: 'culture',
        lat: 32.2432, lng: 77.1892, district: 'Old Manali',
        description: 'Cedar-roofed pagoda temple set inside a deodar forest grove.',
        durationMin: 75, hours: { open: '08:00', close: '18:00' }, closedDays: [],
        costPerPerson: 0, popularity: 5, tags: ['culture', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'manali-old-town', name: 'Old Manali lanes', category: 'relaxation',
        lat: 32.2430, lng: 77.1810, district: 'Old Manali',
        description: 'Riverside cafes, wooden houses and a slow afternoon by the Beas.',
        durationMin: 120, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 300, popularity: 5, tags: ['relaxation', 'food'], dataStatus: 'sample',
      },
      {
        id: 'manali-solang', name: 'Solang Valley', category: 'adventure',
        lat: 32.3050, lng: 77.1560, district: 'Solang',
        description: 'Valley for paragliding, zorbing and snow activities depending on season.',
        durationMin: 210, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 900, popularity: 5, tags: ['adventure', 'nature'],
        note: 'Adventure activity prices are seasonal estimates.', dataStatus: 'sample',
      },
      {
        id: 'manali-rohtang', name: 'Rohtang Pass', category: 'adventure',
        lat: 32.3720, lng: 77.2470, district: 'Rohtang',
        description: 'High-altitude pass at 3,978 m with snow fields and wide mountain views.',
        durationMin: 300, hours: { open: '07:00', close: '16:00' }, closedDays: [],
        costPerPerson: 800, popularity: 5, tags: ['adventure', 'nature'],
        note: 'Vehicle permit and weather closure not guaranteed; verify locally before travel.',
        dataStatus: 'sample',
      },
      {
        id: 'manali-jogini', name: 'Jogini Falls Trek', category: 'nature',
        lat: 32.2560, lng: 77.1900, district: 'Old Manali',
        description: 'Short forest trek to a waterfall above the Beas river.',
        durationMin: 180, hours: { open: '08:00', close: '16:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['nature', 'adventure'], dataStatus: 'sample',
      },
      {
        id: 'manali-vashisht', name: 'Vashisht Hot Springs', category: 'relaxation',
        lat: 32.2570, lng: 77.1790, district: 'Vashisht',
        description: 'Sulphur springs and a quiet village temple across the river.',
        durationMin: 90, hours: { open: '07:00', close: '19:00' }, closedDays: [],
        costPerPerson: 50, popularity: 4, tags: ['relaxation', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'manali-naggar', name: 'Naggar Castle', category: 'history',
        lat: 32.2900, lng: 77.2070, district: 'Naggar',
        description: 'Stone-and-wood fort once capital of the Kullu kings, now a heritage hotel.',
        durationMin: 90, hours: { open: '09:00', close: '18:00' }, closedDays: [],
        costPerPerson: 150, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'manali-mall-road', name: 'Mall Road & Tibetan Market', category: 'shopping',
        lat: 32.2430, lng: 77.1900, district: 'Manali Town',
        description: 'Main street for woollens, handicrafts and evening snacks.',
        durationMin: 90, hours: { open: '10:00', close: '21:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['shopping', 'food'], dataStatus: 'sample',
      },
      {
        id: 'manali-manu', name: 'Manu Temple', category: 'culture',
        lat: 32.2460, lng: 77.1830, district: 'Old Manali',
        description: 'Rare pagoda-style temple dedicated to the sage Manu.',
        durationMin: 45, hours: { open: '07:00', close: '19:00' }, closedDays: [],
        costPerPerson: 0, popularity: 3, tags: ['culture'], dataStatus: 'sample',
      },
    ],
  },
  {
    id: 'agra',
    name: 'Agra',
    region: 'Uttar Pradesh, India',
    lat: 27.1767,
    lng: 78.0081,
    blurb: 'Mughal marble, riverfront gardens and the Taj at sunrise.',
    bestSeason: 'October to March',
    costs: { perNight: 3000, foodPerDay: 1100 },
    attractions: [
      {
        id: 'agra-taj', name: 'Taj Mahal', category: 'history',
        lat: 27.1751, lng: 78.0421, district: 'Dharmapuri',
        description: 'The white marble mausoleum, best in the first hour after opening.',
        durationMin: 180, hours: { open: '09:00', close: '17:00' }, closedDays: [5],
        costPerPerson: 250, popularity: 5, tags: ['history', 'culture'],
        note: 'Closed on Fridays. Entry fee is an estimate and varies by nationality.',
        dataStatus: 'sample',
      },
      {
        id: 'agra-fort', name: 'Agra Fort', category: 'history',
        lat: 27.1820, lng: 78.0210, district: 'Rajaseh',
        description: 'Red sandstone fort of palaces, audience halls and river views.',
        durationMin: 120, hours: { open: '08:00', close: '17:00' }, closedDays: [],
        costPerPerson: 400, popularity: 5, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'agra-mehtab-bagh', name: 'Mehtab Bagh', category: 'nature',
        lat: 27.1800, lng: 78.0300, district: 'Khas',
        description: 'Riverfront garden facing the Taj - the classic sunset viewpoint.',
        durationMin: 75, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 25, popularity: 4, tags: ['nature', 'history'], dataStatus: 'sample',
      },
      {
        id: 'agra-itmad', name: 'Itmad-ud-Daulah', category: 'history',
        lat: 27.1910, lng: 78.0320, district: 'Yamuna',
        description: 'The "Baby Taj", an early marble tomb with delicate pietra dura.',
        durationMin: 75, hours: { open: '08:00', close: '17:00' }, closedDays: [],
        costPerPerson: 200, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'agra-fatehpur', name: 'Fatehpur Sikri', category: 'history',
        lat: 27.0945, lng: 77.6679, district: 'Fatehpur Sikri',
        description: 'Abandoned Mughal city of palaces and the great Buland Darwaza gate.',
        durationMin: 210, hours: { open: '08:00', close: '17:00' }, closedDays: [],
        costPerPerson: 500, popularity: 5, tags: ['history', 'culture'],
        note: 'About 40 km from central Agra - allow a full half-day for travel.',
        dataStatus: 'sample',
      },
      {
        id: 'agra-sikandra', name: "Akbar's Tomb, Sikandra", category: 'history',
        lat: 27.1500, lng: 78.0250, district: 'Sikandra',
        description: 'Tomb of Akbar with red sandstone gateways and a quiet garden setting.',
        durationMin: 75, hours: { open: '08:00', close: '17:30' }, closedDays: [],
        costPerPerson: 150, popularity: 3, tags: ['history', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'agra-kinari', name: 'Kinari Bazaar', category: 'shopping',
        lat: 27.1840, lng: 78.0160, district: 'Tajganj',
        description: 'Lane market near the fort for marble inlay, leather and textiles.',
        durationMin: 75, hours: { open: '10:00', close: '20:00' }, closedDays: [],
        costPerPerson: 0, popularity: 3, tags: ['shopping', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'agra-food-street', name: 'Mughlai food walk, Sadar Bazaar', category: 'food',
        lat: 27.1870, lng: 78.0130, district: 'Sadar',
        description: 'Evening street of petha shops, kebabs and Mughlai thalis.',
        durationMin: 90, hours: { open: '11:00', close: '22:30' }, closedDays: [],
        costPerPerson: 400, popularity: 4, tags: ['food', 'culture'], dataStatus: 'sample',
      },
    ],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    region: 'Rajasthan, India',
    lat: 24.5854,
    lng: 73.7125,
    blurb: 'Lakes, white palaces and hilltop views.',
    bestSeason: 'September to March',
    costs: { perNight: 4200, foodPerDay: 1500 },
    attractions: [
      {
        id: 'udaipur-city-palace', name: 'City Palace', category: 'history',
        lat: 24.5765, lng: 73.6800, district: 'Old City',
        description: 'Lakefront palace of balconies, towers and museum courtyards.',
        durationMin: 150, hours: { open: '09:30', close: '17:30' }, closedDays: [],
        costPerPerson: 300, popularity: 5, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-pichola-boat', name: 'Lake Pichola boat ride', category: 'relaxation',
        lat: 24.5760, lng: 73.6800, district: 'Old City',
        description: 'Shared boat crossing past Jag Mandir and the palaces on the lake.',
        durationMin: 60, hours: { open: '09:00', close: '18:00' }, closedDays: [],
        costPerPerson: 400, popularity: 5, tags: ['relaxation', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-jagdish', name: 'Jagdish Temple', category: 'culture',
        lat: 24.5780, lng: 73.6820, district: 'Old City',
        description: 'Three-storey Indo-Aryan temple with carved mithuna figures.',
        durationMin: 45, hours: { open: '05:00', close: '21:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['culture'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-shelesh', name: 'Saheliyon ki Bari', category: 'nature',
        lat: 24.5900, lng: 73.6900, district: 'North',
        description: 'Garden of lotus pools and fountains built for royal attendants.',
        durationMin: 60, hours: { open: '09:00', close: '19:00' }, closedDays: [],
        costPerPerson: 30, popularity: 4, tags: ['nature', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-monsoon-palace', name: 'Monsoon Palace (Sajjangarh)', category: 'nature',
        lat: 24.5600, lng: 73.6600, district: 'Sajjangarh',
        description: 'Hilltop palace with a wide view of the lakes and the Aravallis.',
        durationMin: 105, hours: { open: '09:00', close: '18:00' }, closedDays: [],
        costPerPerson: 80, popularity: 4, tags: ['nature', 'history'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-fateh-sagar', name: 'Fateh Sagar Lake', category: 'nature',
        lat: 24.6000, lng: 73.6800, district: 'North',
        description: 'Promenade around the second lake - good for a slow evening walk.',
        durationMin: 75, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['nature', 'relaxation'], dataStatus: 'sample',
      },
      {
        id: 'udaipur-bagore', name: 'Bagore ki Haveli (folk show)', category: 'culture',
        lat: 24.5770, lng: 73.6810, district: 'Old City',
        description: 'Evening Rajasthani dance and puppet show in a restored haveli.',
        durationMin: 75, hours: { open: '18:00', close: '19:30' }, closedDays: [],
        costPerPerson: 150, popularity: 4, tags: ['culture'],
        note: 'Evening performance timing - confirm show schedule locally.', dataStatus: 'sample',
      },
      {
        id: 'udaipur-shilpgram', name: 'Shilpgram', category: 'shopping',
        lat: 24.5540, lng: 73.6790, district: 'Udaipur',
        description: 'Crafts village of huts, weavers and potters with a small entry fee.',
        durationMin: 90, hours: { open: '10:00', close: '18:00' }, closedDays: [],
        costPerPerson: 60, popularity: 3, tags: ['shopping', 'culture'], dataStatus: 'sample',
      },
    ],
  },
  {
    id: 'kochi',
    name: 'Kochi',
    region: 'Kerala, India',
    lat: 4.9820,
    lng: 76.2700,
    blurb: 'Chinese nets, spice streets and harbour sunsets.',
    bestSeason: 'November to February',
    costs: { perNight: 3000, foodPerDay: 1250 },
    attractions: [
      {
        id: 'kochi-chinese-nets', name: 'Chinese Fishing Nets', category: 'culture',
        lat: 4.9820, lng: 76.2760, district: 'Fort Kochi',
        description: 'Cantilevered nets worked by hand at the harbour mouth - best near sunset.',
        durationMin: 45, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 5, tags: ['culture', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'kochi-mattancherry', name: 'Mattancherry Palace', category: 'history',
        lat: 4.9760, lng: 76.2600, district: 'Mattancherry',
        description: 'Dutch-built palace with Kerala murals of Hindu temple art.',
        durationMin: 75, hours: { open: '10:00', close: '17:00' }, closedDays: [5],
        costPerPerson: 50, popularity: 4, tags: ['history', 'culture'],
        note: 'Closed on Fridays.', dataStatus: 'sample',
      },
      {
        id: 'kochi-st-francis', name: 'St. Francis Church', category: 'history',
        lat: 4.9810, lng: 76.2700, district: 'Fort Kochi',
        description: 'One of the oldest European churches in India, Vasco da Gama was buried here.',
        durationMin: 45, hours: { open: '09:00', close: '17:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['history', 'culture'], dataStatus: 'sample',
      },
      {
        id: 'kochi-kathakali', name: 'Kathakali performance', category: 'culture',
        lat: 4.9830, lng: 76.2740, district: 'Fort Kochi',
        description: 'Evening classical dance-drama with elaborate makeup and costume.',
        durationMin: 105, hours: { open: '17:00', close: '19:30' }, closedDays: [],
        costPerPerson: 400, popularity: 4, tags: ['culture'],
        note: 'Evening show timings vary by centre.', dataStatus: 'sample',
      },
      {
        id: 'kochi-marine-drive', name: 'Marine Drive', category: 'relaxation',
        lat: 4.9850, lng: 76.2780, district: 'Ernakulam',
        description: 'Curving waterfront promenade - the local evening hangout.',
        durationMin: 60, hours: null, hoursNote: 'Open all day', closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['relaxation', 'nature'], dataStatus: 'sample',
      },
      {
        id: 'kochi-paradesi-synagogue', name: 'Paradesi Synagogue', category: 'history',
        lat: 4.9750, lng: 76.2590, district: 'Mattancherry',
        description: '1568 synagogue with hand-painted floor tiles and Belgian chandeliers.',
        durationMin: 45, hours: { open: '10:00', close: '17:00' }, closedDays: [6],
        costPerPerson: 50, popularity: 4, tags: ['history', 'culture'],
        note: 'Closed on Saturdays.', dataStatus: 'sample',
      },
      {
        id: 'kochi-broadway', name: 'Broadway Market', category: 'shopping',
        lat: 4.9800, lng: 76.2680, district: 'Ernakulam',
        description: 'Wholesale market lane for spices, textiles and household goods.',
        durationMin: 75, hours: { open: '09:00', close: '19:00' }, closedDays: [],
        costPerPerson: 0, popularity: 3, tags: ['shopping', 'food'], dataStatus: 'sample',
      },
      {
        id: 'kochi-jew-town', name: 'Jew Town', category: 'shopping',
        lat: 4.9755, lng: 76.2610, district: 'Mattancherry',
        description: 'Antique shops, spice godowns and the lane beside the old synagogue.',
        durationMin: 75, hours: { open: '09:00', close: '18:00' }, closedDays: [],
        costPerPerson: 0, popularity: 4, tags: ['shopping', 'culture'], dataStatus: 'sample',
      },
    ],
  },
];

export const DESTINATION_MAP = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));

export function getDestination(id) {
  return DESTINATION_MAP[id] || null;
}

/** Flat list of every attraction, with its destination attached. */
export function allAttractions() {
  return DESTINATIONS.flatMap((d) =>
    d.attractions.map((a) => ({ ...a, destinationId: d.id, destinationName: d.name })),
  );
}

export function findAttraction(destinationId, attractionId) {
  const dest = getDestination(destinationId);
  if (!dest) return null;
  return dest.attractions.find((a) => a.id === attractionId) || null;
}

export const INTEREST_LABELS = {
  nature: 'Nature',
  history: 'History',
  adventure: 'Adventure',
  shopping: 'Shopping',
  food: 'Food',
  beaches: 'Beaches',
  culture: 'Culture',
  relaxation: 'Relaxation',
};
