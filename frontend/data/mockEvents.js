// Mock Events Data for EventHub
// Simple JavaScript array that is beginner-friendly and easy to understand

export const mockEvents = [
  {
    id: 1,
    title: "Music Fest 2025",
    category: "Entertainment",
    date: "12 Dec 2025",
    time: "10:00 AM",
    location: "College Ground, Ahmedabad",
    venue: "College Ground",
    price: 500,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    description: "Music Fest 2025 brings together the best indie artists, rock bands, and DJs for an unforgettable day of live music, food stalls, fun games, and networking with music enthusiasts.",
    organizer: "Campus Youth Club",
    maxParticipants: 1000,
    registeredCount: 650,
    highlights: [
      "Live Performances by top bands",
      "Over 20+ Food & Beverage stalls",
      "Interactive Fun Activities & Gaming Booths",
      "Exclusive Artist Meet & Greet",
      "High quality audio-visual setup"
    ],
    speakers: [
      { name: "Aarav Mehta", role: "Lead Vocalist", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" },
      { name: "Pooja Sharma", role: "Music Director", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 2,
    title: "Tech Conference",
    category: "Conferences",
    date: "15 Dec 2025",
    time: "09:00 AM",
    location: "Convention Center, Gandhinagar",
    venue: "Convention Center",
    price: 1200,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    description: "Join industry leaders, software engineers, and founders to explore emerging trends in Web Development, Artificial Intelligence, Cloud Computing, and Developer Tooling.",
    organizer: "Gujarat Tech Council",
    maxParticipants: 500,
    registeredCount: 420,
    highlights: [
      "Keynotes from Fortune 500 Tech Leads",
      "Hands-on AI & Cloud Workshops",
      "Startup Pitch Competition",
      "Career Networking Lunch"
    ],
    speakers: [
      { name: "Rahul Verma", role: "Principal Architect", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" },
      { name: "Simran Kaur", role: "AI Researcher", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 3,
    title: "Food Festival",
    category: "Social",
    date: "20 Dec 2025",
    time: "11:00 AM",
    location: "Food Park, Riverfront",
    venue: "Food Park",
    price: 0,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    description: "A culinary extravaganza showcasing authentic street foods, multi-cuisine gourmet dishes, dessert trucks, and live chef cooking demonstrations.",
    organizer: "Riverfront Gourmet Association",
    maxParticipants: 800,
    registeredCount: 710,
    highlights: [
      "Over 40 Food Stalls and Food Trucks",
      "Live Dessert Masterclasses",
      "Family friendly dining zones",
      "Live acoustic band performances"
    ],
    speakers: [
      { name: "Chef Sanjeev Anand", role: "Master Chef", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 4,
    title: "Art Exhibition",
    category: "Cultural",
    date: "25 Dec 2025",
    time: "10:00 AM",
    location: "Art Gallery, Ahmedabad",
    venue: "Art Gallery",
    price: 200,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80",
    description: "Experience modern and traditional visual arts created by visionary local and international artists. Featuring oil paintings, sculptures, and digital art installations.",
    organizer: "Creative Arts Guild",
    maxParticipants: 300,
    registeredCount: 180,
    highlights: [
      "Curated collection of 150+ contemporary artworks",
      "Interactive pottery and sketching corners",
      "Guided gallery tours every hour"
    ],
    speakers: [
      { name: "Meera Patel", role: "Lead Curator", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 5,
    title: "Web Development Workshop",
    category: "Workshops",
    date: "18 Dec 2025",
    time: "10:00 AM",
    location: "Tech Park, Ahmedabad",
    venue: "Tech Park",
    price: 350,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    description: "Hands-on coding bootcamp focusing on modern React, Next.js, and REST APIs. Suitable for college students, aspiring software engineers, and beginner programmers.",
    organizer: "DevCoders Community",
    maxParticipants: 100,
    registeredCount: 95,
    highlights: [
      "Build a complete web project from scratch",
      "Certificate of Participation provided",
      "Q&A session with senior developers"
    ],
    speakers: [
      { name: "Karan Desai", role: "Senior Full Stack Dev", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 6,
    title: "Cultural Fest 2025",
    category: "Cultural",
    date: "29 Dec 2025",
    time: "06:00 PM",
    location: "College Ground, Vadodara",
    venue: "College Ground",
    price: 150,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    description: "Annual cultural extravaganza celebrating classical and folk dance, theater drama, musical performances, and regional heritage displays.",
    organizer: "University Cultural Board",
    maxParticipants: 1200,
    registeredCount: 890,
    highlights: [
      "Folk Dance Competitions",
      "Drama and Street Play Showcases",
      "Ethnic Fashion Showcase"
    ],
    speakers: [
      { name: "Ananya Trivedi", role: "Cultural Secretary", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 7,
    title: "Business Networking Meet",
    category: "Business",
    date: "30 Dec 2025",
    time: "10:00 AM",
    location: "Hotel Grand, Ahmedabad",
    venue: "Hotel Grand",
    price: 800,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    description: "An exclusive summit for entrepreneurs, startup founders, investors, and business professionals to pitch ideas, explore partnerships, and accelerate growth.",
    organizer: "Ahmedabad Business Club",
    maxParticipants: 200,
    registeredCount: 160,
    highlights: [
      "Speed Networking Sessions",
      "Investor Panel Discussion",
      "Buffet Lunch and High Tea included"
    ],
    speakers: [
      { name: "Vikram Singhania", role: "Venture Partner", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80"
    ]
  },
  {
    id: 8,
    title: "Inter-College Sports Tournament",
    category: "Sports",
    date: "05 Jan 2026",
    time: "08:00 AM",
    location: "City Sports Complex, Surat",
    venue: "City Sports Complex",
    price: 300,
    status: "Open for Registration",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    description: "Competitive multi-sport tournament featuring Cricket, Football, Badminton, and Volleyball championships with trophies and cash awards.",
    organizer: "District Sports Association",
    maxParticipants: 600,
    registeredCount: 450,
    highlights: [
      "Professional referees and commentators",
      "Medals, trophies, and cash prizes",
      "Energy drinks and first aid facilities"
    ],
    speakers: [
      { name: "Coach Rajesh Rathi", role: "Chief Referee", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" }
    ],
    gallery: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80"
    ]
  }
];

// Available event categories matching the specification
export const eventCategories = [
  "All",
  "Educational",
  "Cultural",
  "Sports",
  "Business",
  "Workshops",
  "Conferences",
  "Entertainment",
  "Social"
];
