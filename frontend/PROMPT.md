Absolutely. The screenshot is a **frontend specification board containing 12 screens** for an Event Management System. The goal should be to recreate the website as a real responsive frontend, not simply reproduce the screenshot as one static page.

Here is a ready-to-use instruction prompt for an AI coding agent.

---

# Frontend Implementation Instructions: Event Management System

Build the complete **Event Management System frontend** shown in the provided reference screenshot.

The screenshot represents the intended visual language, layout, navigation structure, components, and page hierarchy. Treat it as the primary visual reference.

The implementation must be a **real responsive web application with separate routes/pages**, reusable components, realistic mock data, functional interactions, forms, filters, navigation, and responsive behavior.

## 1. Technology Requirements

Use:

- React
- Vite
- React Router
- Axios
- Tailwind CSS and/or Bootstrap
- Modern JavaScript or TypeScript
- Lucide React or another consistent icon library

Do not use manually drawn SVG icons when an appropriate icon exists in the icon library.

Use reusable React components rather than duplicating markup between pages.

The frontend must work entirely with mock/local data for now. Structure the API layer with Axios so a real backend can be connected later without redesigning the application.

---

# 2. Overall Product

Product name:

**Event Management System**

The platform allows users to:

- Discover upcoming events
- Search and filter events
- View event details
- Register for events
- Manage their registrations
- Create events as organizers
- Manage their profile
- Receive notifications
- Contact the platform
- Learn about the platform

There are three primary user experiences:

1. Public visitor
2. Registered user
3. Organizer/Admin

---

# 3. Visual Design Direction

Recreate the visual language from the reference screenshot.

### Overall style

Use a:

- Modern
- Clean
- Professional
- Friendly
- Lightweight
- Corporate SaaS-style interface

The design should feel like a modern event discovery platform rather than an old enterprise application.

### Primary visual characteristics

- White backgrounds
- Very light blue backgrounds where appropriate
- Dark navy typography
- Bright blue primary actions
- Subtle borders
- Very soft shadows
- Rounded corners
- Compact cards
- Generous but controlled whitespace
- Small status badges
- Clean iconography
- Consistent form controls
- Responsive grid layouts

### Suggested colors

Use approximately:

```text
Primary Blue:       #2563EB
Dark Navy:          #123B70
Secondary Blue:     #3B82F6
Light Blue:         #EFF6FF
Page Background:    #F8FAFC
White:              #FFFFFF
Border:             #DCE7F3
Primary Text:       #17365D
Secondary Text:     #64748B
Success:            #16A34A
Warning:            #F59E0B
Danger:             #DC2626
```

Do not overuse blue.

Blue should primarily be used for:

- Primary buttons
- Active navigation
- Links
- Important icons
- Selected states
- Small highlights

---

# 4. Application Layout

Create a consistent application shell.

## Public pages

Public pages should have a common top navigation:

```text
EventHub / Event Management System

Home
Events
About
Contact

Login
Sign Up
```

The navigation should collapse into a mobile menu on smaller screens.

---

# 5. Authenticated Application Layout

Authenticated pages use an application header similar to the screenshot.

Header:

```text
EventHub

Home
Events
My Registrations
Create Event
About
Contact

Search
Notifications
User Avatar
```

Depending on the user's role, show relevant navigation items.

For dashboard-style pages, use a left sidebar on desktop.

Sidebar:

```text
Dashboard
My Profile
Events
Registrations
Create Event
Notifications
Settings
Logout
```

On mobile, convert the sidebar into either:

- Drawer
- Slide-over menu
- Bottom/mobile navigation where appropriate

---

# 6. Screen 1: Home Page

Route:

```text
/
```

Create the main landing page.

## Hero section

Large event discovery hero.

Include:

- Large event-related background image
- Dark/light overlay for readability
- Heading:

**Discover Amazing Events Near You**

Supporting text:

**Find, register, and be a part of exciting events around you.**

Add a prominent search bar.

Search placeholder:

```text
Search events, categories, locations...
```

Include search button with search icon.

## Upcoming Events

Below the hero:

```text
Upcoming Events
View All →
```

Display event cards in a responsive grid.

Each event card should contain:

- Event image
- Category
- Event title
- Date
- Time
- Location
- Short description if space allows
- View Details button

Example events:

- Music Fest 2025
- Tech Conference
- Food Festival
- Art Exhibition
- Business Networking Meet
- Cultural Fest

Cards should have subtle hover effects.

---

# 7. Screen 2: Login Page

Route:

```text
/login
```

Create a centered authentication layout.

Desktop layout should visually resemble the screenshot:

Left:

- Event illustration
- Friendly welcome message

Right:

Login form.

Heading:

**Welcome Back**

Fields:

```text
Email or Username
Password
```

Additional controls:

```text
Remember Me
Forgot Password?
```

Primary button:

```text
Login
```

Below:

```text
Don't have an account? Sign Up
```

Include appropriate validation states.

Password field should include show/hide password functionality.

Do not use browser alerts.

---

# 8. Screen 3: Sign Up Page

Route:

```text
/signup
```

Heading:

**Create Your Account**

Supporting text:

**Join us and be a part of exciting events.**

Form:

```text
Full Name
Email
Phone
Password
Confirm Password
```

Primary action:

```text
Sign Up
```

Bottom link:

```text
Already have an account? Login
```

Include:

- Validation
- Password visibility
- Password strength indicator if appropriate
- Inline error messages
- Success state

---

# 9. Screen 4: Events Listing Page

Route:

```text
/events
```

This is the primary event discovery interface.

Desktop layout:

### Left filter panel

Categories:

```text
All
Educational
Cultural
Sports
Business
Workshops
Conferences
Entertainment
Social
```

Use selectable checkboxes/radio controls.

### Main content

Top toolbar:

```text
Events
Search Events...
Sort / Filter
```

Show event count.

Event cards should be displayed in a responsive grid.

Each card contains:

- Event image
- Category badge
- Event title
- Date
- Location
- Short metadata
- View Details button

Add pagination or load-more behavior.

Search should filter events.

Category selection should dynamically filter events.

---

# 10. Screen 5: Event Details Page

Route:

```text
/events/:id
```

Create a detailed event page.

Top:

Large event banner image.

Show:

```text
Event Title
Date
Time
Location
Category
```

Primary CTA:

```text
Register Now
```

If already registered:

```text
Registered
```

Sections:

### About Event

Full event description.

### Event Highlights

Example:

```text
Live Performances
Expert Speakers
Food & Refreshments
Fun Activities
Networking
```

### Speakers

Display speaker cards where applicable.

### Location

Show location information.

### Gallery

Show event gallery images.

Make the registration CTA highly visible.

---

# 11. Screen 6: My Registrations Page

Route:

```text
/registrations
```

Heading:

**My Registrations**

Display registered events in a table on desktop and cards on mobile.

Columns:

```text
Event Name
Date & Time
Location
Status
Actions
```

Statuses:

```text
Confirmed
Pending
Cancelled
```

Use colored status badges.

Actions:

```text
View
```

Allow the user to open the associated event.

---

# 12. Screen 7: Profile / My Account

Route:

```text
/profile
```

Use a two-column layout.

### Left sidebar

```text
My Profile
My Registrations
Notifications
Change Password
Logout
```

### Main section

Heading:

**My Profile**

Profile avatar.

Allow changing profile photo.

Fields:

```text
Full Name
Email
Phone
Address
```

Primary button:

```text
Update Profile
```

Use proper form validation.

---

# 13. Screen 8: About Us

Route:

```text
/about
```

Create an informational marketing page.

Hero section:

```text
About Us
Connecting People Through Events
```

Include event-related image.

Content explaining the platform.

Add feature cards such as:

```text
Easy Registration
Build a Connected Community
Trusted & Secure
```

Include short descriptions.

The page should feel like a polished SaaS/product marketing page.

---

# 14. Screen 9: Contact Us

Route:

```text
/contact
```

Heading:

**Get in Touch**

Two-column layout.

### Left

Contact information:

```text
Address
Email
Phone
Social Media
```

Use icons.

### Right

Contact form:

```text
Name
Email
Message
```

Primary button:

```text
Send Message
```

Show an inline success message after submission.

Do not use browser alerts.

---

# 15. Screen 10: Create Event Page

Route:

```text
/create-event
```

This page is for organizers.

Heading:

**Create New Event**

Create a professional multi-field form.

Fields:

```text
Event Name
Category
Date
Time
Location
Description
Event Image
Registration Fee
Registration Form
```

Image upload should have a visible upload/dropzone area.

Primary button:

```text
Create Event
```

Include:

- Form validation
- Required field indicators
- Date/time controls
- Image preview
- Error messages
- Submission success state

Structure the form into logical sections rather than presenting one huge block of fields.

---

# 16. Screen 11: Admin Dashboard

Route:

```text
/admin
```

Create the main administration dashboard.

Use the authenticated dashboard shell with sidebar.

### Sidebar

```text
Dashboard
Users
Events
Categories
Registrations
Notifications
Settings
```

### Dashboard statistics

Show three or more metric blocks.

Example:

```text
Total Users
245
```

```text
Total Events
156
```

```text
Total Registrations
312
```

Use clean icons and subtle backgrounds.

### Recent Registrations

Table:

```text
User
Event
Date
Status
```

Statuses:

```text
Confirmed
Pending
Cancelled
```

Include a dashboard work area for:

- Recent registrations
- Upcoming events
- Event approval
- User activity

Do not make the dashboard excessively card-heavy. Keep the visual hierarchy clean and compact.

---

# 17. Screen 12: Notifications

Route:

```text
/notifications
```

Heading:

**Notifications**

Create a notification list.

Each notification should contain:

- Status/type icon
- Notification title
- Description
- Date/time
- Read/unread state

Example notifications:

```text
Your registration for Music Fest 2025 has been confirmed.

Event Cultural Fest 2025 has been updated.

Registration deadline for Food Festival is tomorrow.

New Event: Business Networking Meet is now available.

Password changed successfully.
```

Use different subtle icon treatments for:

- Information
- Success
- Warning
- Error

Unread notifications should have a visually distinguishable background.

---

# 18. Shared Components

Create reusable components.

At minimum:

```text
Navbar
Footer
Sidebar
MobileMenu
PageHeader
SearchBar
Button
Input
Select
Textarea
Modal
Badge
StatusBadge
EventCard
EventGrid
EventImage
EventMeta
RegistrationTable
NotificationItem
ProfileCard
StatCard
EmptyState
LoadingState
Pagination
FormField
FileUpload
Avatar
```

Do not duplicate these components across pages.

---

# 19. Event Data Model

Create mock event data with realistic values.

Each event should have:

```js
{
  id,
  title,
  category,
  description,
  image,
  date,
  time,
  location,
  organizer,
  status,
  registrationStatus,
  speakers,
  highlights,
  gallery
}
```

Use enough mock records to make:

- Search
- Filtering
- Sorting
- Pagination
- Registration status

feel realistic.

---

# 20. Routing

Implement React Router.

Required routes:

```text
/
/login
/signup
/events
/events/:id
/registrations
/profile
/about
/contact
/create-event
/notifications
/admin
/admin/users
/admin/events
/admin/categories
/admin/registrations
/admin/settings
```

Add a proper fallback:

```text
/404
```

---

# 21. Responsive Design

This is extremely important.

The screenshot is desktop-oriented, but the actual website must be fully responsive.

### Desktop

Use:

- Multi-column layouts
- Sidebar
- Event grids
- Tables
- Full navigation

### Tablet

Collapse layouts where necessary.

### Mobile

Use:

- Single-column content
- Mobile navigation
- Drawer/sidebar
- Stacked forms
- Event cards
- Responsive tables converted into cards
- Full-width buttons where appropriate

No horizontal scrolling should occur.

Forms must remain easy to use on mobile.

---

# 22. UX Requirements

Do not create a purely visual mockup.

Interactions should actually work.

Implement:

- Navigation
- Search
- Event filtering
- Event sorting
- Event detail navigation
- Registration action
- Login form state
- Signup form state
- Profile editing
- Event creation
- Notification read/unread state
- Mobile menu
- Sidebar navigation
- Modal/dialog interactions
- Form validation
- Loading states
- Empty states
- Success states
- Error states

Use local state or mock services where backend functionality is unavailable.

---

# 23. API Architecture

Create a clean API abstraction.

For example:

```text
src/
  api/
    axios.js
    authApi.js
    eventsApi.js
    registrationApi.js
    profileApi.js
    notificationApi.js
    adminApi.js
```

Do not put Axios calls directly throughout UI components.

The UI should communicate through service/API modules.

This will allow the backend to be connected later.

---

# 24. Project Structure

Use a maintainable structure similar to:

```text
src/
  components/
    common/
    layout/
    events/
    forms/
    dashboard/
    notifications/

  pages/
    Home/
    Auth/
    Events/
    Registrations/
    Profile/
    About/
    Contact/
    CreateEvent/
    Notifications/
    Admin/

  layouts/
    PublicLayout
    AppLayout
    AdminLayout

  api/
  hooks/
  context/
  data/
  utils/
  assets/
  routes/
  App
```

The exact folder structure can be adjusted if the existing project already has an established architecture.

Do not unnecessarily rewrite an existing architecture.

---

# 25. Important Visual Rule

Do **not** simply reproduce the screenshot as a giant static dashboard.

The screenshot is a **design reference showing the expected screens**.

Build the actual application represented by those screens.

Each numbered screen in the reference corresponds to an actual route/view.

The final result should feel like one coherent Event Management System, not 12 unrelated mockups.

---

# 26. Final Quality Requirements

Before considering the implementation complete, verify:

- All 12 reference screens exist
- Every screen has a real route
- Navigation works
- Event cards link to event details
- Search works
- Category filtering works
- Registration flow works in frontend state
- Login and signup forms work
- Profile editing works
- Create-event form works
- Notifications work
- Admin dashboard works
- Mobile layout works
- No browser alerts are used
- No placeholder buttons that do nothing
- No broken links
- No horizontal overflow
- No console errors
- Images have appropriate `alt` text
- Forms have accessible labels
- Buttons have meaningful labels
- Keyboard navigation works
- Focus states are visible
- Loading and empty states are handled
- UI remains visually consistent across every route

## Most important instruction

**Use the supplied screenshot as the visual source of truth for the overall composition, spacing, typography hierarchy, colors, cards, navigation, forms, event grids, dashboard structure, and component styling. Build a production-quality responsive React frontend that faithfully translates all 12 screens into a functional website.**