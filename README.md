# Boondocks Barbershop Booking Widget

A modern, single-page booking interface for Boondocks Barbershop in San Carlos, featuring a traditional barbershop aesthetic with contemporary functionality.

## Features

- **Single-Page Interface**: Complete booking flow on one page
- **Traditional Barbershop Design**: Authentic styling with barber pole stripes and classic colors
- **Mobile-First**: Optimized for iPhone 15 and all mobile devices
- **Dynamic Slot Counting**: Real-time availability updates based on selected service and barber
- **Provider-Specific Scheduling**: Accurate slot counts based on each barber's working hours
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## Tech Stack

This is a [Next.js](https://nextjs.org) project built with:

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **CSS-in-JS** for component styling
- **CSV Data Integration** for services and provider availability
- **date-fns** for date manipulation

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the booking widget.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main booking widget (single-page interface)
│   ├── layout.tsx         # Root layout with mobile viewport config
│   └── globals.css        # Global styles with Google Fonts
├── components/            # React components (legacy multi-step components)
├── lib/                   # Utilities and data loading
│   ├── data.ts           # CSV data loading and processing
│   ├── types.ts          # TypeScript interfaces
│   └── simplybook-api.ts # SimplyBook.me API integration (optional)
└── public/data/          # CSV data files
    ├── boondocks_provider_availability.csv
    └── boondocks_service_provider_matrix.csv
```

## Key Features

### Dynamic Slot Counting
- Shows available appointment slots per day
- Updates in real-time when barbers are selected
- Respects each barber's working schedule
- Visual indicators for full/past/available dates

### Mobile Optimization
- iPhone 15 safe area support
- Touch-friendly 48px minimum touch targets
- Smooth scrolling and native app feel
- Optimized typography and spacing

### Traditional Barbershop Aesthetic
- Custom color palette: #1a1a1a, #f5f5f0, #8b7355, #c41e3a, #1e4d8b
- Bebas Neue, Oswald, and Roboto font stack
- Barber pole stripe patterns
- Authentic barbershop styling

## Customization

The booking widget can be customized by:

1. **Updating CSV Data**: Modify provider availability and service matrix
2. **Styling**: Adjust colors and fonts in the CSS-in-JS styles
3. **API Integration**: Connect to SimplyBook.me or other booking APIs
4. **Components**: Add new features using the existing component structure

## Deployment

Deploy on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

```bash
npm run build
```

The app is optimized for static export and can be deployed to any hosting platform.

## Development

The project includes:
- TypeScript for development safety
- ESLint for code quality
- Responsive design testing
- Mobile-first development approach

## License

MIT License - Built for Boondocks Barbershop