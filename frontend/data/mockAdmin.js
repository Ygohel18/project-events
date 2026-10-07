// Mock Admin Data for Management Pages (Screen 11 & Admin Sub-pages)
// Dashboard mock data structure

export const mockAdminStats = {
  totalUsers: 245,
  totalEvents: 156,
  totalRegistrations: 312,
  activeCategories: 8,
  revenue: "₹ 1,48,500"
};

export const mockRecentRegistrations = [
  {
    id: 1,
    user: "Riya Shah",
    event: "Tech Conference",
    date: "12 Dec",
    status: "Confirmed"
  },
  {
    id: 2,
    user: "Jayesh Patel",
    event: "Music Fest",
    date: "10 Dec",
    status: "Pending"
  },
  {
    id: 3,
    user: "Mehul Joshi",
    event: "Cultural Fest",
    date: "08 Dec",
    status: "Confirmed"
  },
  {
    id: 4,
    user: "Neha Desai",
    event: "Food Festival",
    date: "05 Dec",
    status: "Confirmed"
  }
];

// 1. Users List for /admin/users
export const initialAdminUsers = [
  {
    id: 1,
    name: "Full Name",
    email: "disha@example.com",
    role: "Admin",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    status: "Active",
    registeredEvents: 5,
    joinedDate: "15 Oct 2024"
  },
  {
    id: 2,
    name: "Riya Shah",
    email: "riya.shah@example.com",
    role: "Organizer",
    phone: "+91 98250 11223",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    status: "Active",
    registeredEvents: 3,
    joinedDate: "02 Nov 2024"
  },
  {
    id: 3,
    name: "Jayesh Patel",
    email: "jayesh.p@example.com",
    role: "Attendee",
    phone: "+91 97234 55667",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    status: "Active",
    registeredEvents: 2,
    joinedDate: "10 Nov 2024"
  },
  {
    id: 4,
    name: "Mehul Joshi",
    email: "mehul.joshi@example.com",
    role: "Attendee",
    phone: "+91 98980 99887",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    status: "Active",
    registeredEvents: 4,
    joinedDate: "18 Nov 2024"
  },
  {
    id: 5,
    name: "Neha Desai",
    email: "neha.desai@example.com",
    role: "Organizer",
    phone: "+91 94260 77889",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    status: "Active",
    registeredEvents: 1,
    joinedDate: "25 Nov 2024"
  },
  {
    id: 6,
    name: "Amit Sharma",
    email: "amit.sharma@example.com",
    role: "Attendee",
    phone: "+91 91234 56780",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80",
    status: "Inactive",
    registeredEvents: 0,
    joinedDate: "01 Dec 2024"
  }
];

// 2. Events List with Images for /admin/events
export const initialAdminEvents = [
  {
    id: 1,
    title: "Music Fest 2025",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    category: "Entertainment",
    date: "12 Dec 2025",
    time: "10:00 AM",
    location: "College Ground, Ahmedabad",
    price: 500,
    registeredCount: 340,
    maxParticipants: 500,
    status: "Published"
  },
  {
    id: 2,
    title: "Tech Conference",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
    category: "Conferences",
    date: "15 Dec 2025",
    time: "09:00 AM",
    location: "Convention Center, Gandhinagar",
    price: 1200,
    registeredCount: 180,
    maxParticipants: 200,
    status: "Published"
  },
  {
    id: 3,
    title: "Food Festival",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    category: "Social",
    date: "20 Dec 2025",
    time: "11:00 AM",
    location: "Food Park, Riverfront",
    price: 0,
    registeredCount: 420,
    maxParticipants: 600,
    status: "Published"
  },
  {
    id: 4,
    title: "Art Exhibition",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80",
    category: "Cultural",
    date: "25 Dec 2025",
    time: "10:00 AM",
    location: "Art Gallery, Ahmedabad",
    price: 200,
    registeredCount: 95,
    maxParticipants: 150,
    status: "Published"
  },
  {
    id: 5,
    title: "Web Development Workshop",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    category: "Educational",
    date: "28 Dec 2025",
    time: "02:00 PM",
    location: "Tech Hub, Ahmedabad",
    price: 400,
    registeredCount: 65,
    maxParticipants: 80,
    status: "Draft"
  },
  {
    id: 6,
    title: "Business Networking Meet",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
    category: "Business",
    date: "30 Dec 2025",
    time: "06:00 PM",
    location: "Grand Palace Hotel, Ahmedabad",
    price: 750,
    registeredCount: 110,
    maxParticipants: 120,
    status: "Published"
  }
];

// 3. Categories List for /admin/categories
export const initialAdminCategories = [
  {
    id: 1,
    name: "Educational",
    slug: "educational",
    eventsCount: 24,
    description: "Academic lectures, workshops, seminars, and masterclasses.",
    status: "Active"
  },
  {
    id: 2,
    name: "Cultural",
    slug: "cultural",
    eventsCount: 18,
    description: "Art exhibitions, dance, drama, and traditional festivals.",
    status: "Active"
  },
  {
    id: 3,
    name: "Sports",
    slug: "sports",
    eventsCount: 15,
    description: "Tournaments, athletic events, e-sports, and marathons.",
    status: "Active"
  },
  {
    id: 4,
    name: "Business",
    slug: "business",
    eventsCount: 20,
    description: "Networking meetups, corporate summits, and startup pitches.",
    status: "Active"
  },
  {
    id: 5,
    name: "Conferences",
    slug: "conferences",
    eventsCount: 32,
    description: "Large scale multi-day tech and academic summits.",
    status: "Active"
  },
  {
    id: 6,
    name: "Entertainment",
    slug: "entertainment",
    eventsCount: 45,
    description: "Music concerts, stand-up comedy, and movie screenings.",
    status: "Active"
  },
  {
    id: 7,
    name: "Social",
    slug: "social",
    eventsCount: 12,
    description: "Food fairs, community gatherings, and meetups.",
    status: "Active"
  }
];

// 4. Registrations List for /admin/registrations
export const initialAdminRegistrations = [
  {
    id: 1,
    ticketNumber: "TKT-1001",
    user: "Riya Shah",
    email: "riya.shah@example.com",
    event: "Tech Conference",
    date: "12 Dec 2025",
    amount: "₹ 1200",
    status: "Confirmed"
  },
  {
    id: 2,
    ticketNumber: "TKT-1002",
    user: "Jayesh Patel",
    email: "jayesh.p@example.com",
    event: "Music Fest 2025",
    date: "10 Dec 2025",
    amount: "₹ 500",
    status: "Pending"
  },
  {
    id: 3,
    ticketNumber: "TKT-1003",
    user: "Mehul Joshi",
    email: "mehul.joshi@example.com",
    event: "Cultural Fest 2025",
    date: "08 Dec 2025",
    amount: "₹ 200",
    status: "Confirmed"
  },
  {
    id: 4,
    ticketNumber: "TKT-1004",
    user: "Neha Desai",
    email: "neha.desai@example.com",
    event: "Food Festival",
    date: "05 Dec 2025",
    amount: "Free",
    status: "Confirmed"
  },
  {
    id: 5,
    ticketNumber: "TKT-1005",
    user: "Amit Sharma",
    email: "amit.sharma@example.com",
    event: "Web Development Workshop",
    date: "02 Dec 2025",
    amount: "₹ 400",
    status: "Cancelled"
  },
  {
    id: 6,
    ticketNumber: "TKT-1006",
    user: "Pooja Verma",
    email: "pooja.v@example.com",
    event: "Business Networking Meet",
    date: "01 Dec 2025",
    amount: "₹ 750",
    status: "Confirmed"
  }
];

// 5. Platform Settings for /admin/settings
export const initialAdminSettings = {
  portalName: "EventHub Management",
  supportEmail: "support@eventhub.com",
  contactPhone: "+91 98765 43210",
  publicRegistrationsOpen: true,
  emailNotifications: true,
  maintenanceMode: false
};
