export interface IndustryBenefit {
  title: string;
  description: string;
  icon: 'beer' | 'glass' | 'leaf' | 'utensils' | 'coffee' | 'trophy';
}

export interface RecommendedProduct {
  name: string;
  slug: string;
  description: string;
  shape: string;
}

export interface IndustryData {
  slug: string;
  name: string;
  headline: string;
  heroSubtext: string;
  benefits: IndustryBenefit[];
  recommendedProducts: RecommendedProduct[];
  useCases: string;
  pricingStart: string;
  ctaText: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  breadcrumbLabel: string;
}

export const industries: IndustryData[] = [
  // ─── BREWERY SIGNS ────────────────────────────────────────────────────
  {
    slug: 'brewery-signs',
    name: 'Breweries',
    headline: 'Tin Tackers Built for Breweries',
    heroSubtext:
      'Your beer deserves more than a sticker on a wall. Custom embossed aluminum tin tackers give your brewery brand that real, permanent feel — the kind of sign people steal from bars because they love it that much.',
    benefits: [
      {
        title: 'Taproom Wall Art',
        description:
          'Nothing beats a wall of tin tackers behind the bar. Stack them, line them up, or scatter them — they make any taproom look legit without spending a fortune on decor.',
        icon: 'beer',
      },
      {
        title: 'Distributor & Rep Swag',
        description:
          'Hand them to your distributors and sales reps. They end up on bar walls everywhere, and suddenly your brand is in 50 bars you never even visited.',
        icon: 'beer',
      },
      {
        title: 'Beer Festival Giveaways',
        description:
          'Forget koozies. A tin tacker is something people actually keep. Hand them out at beer fests and watch your booth become the most popular stop.',
        icon: 'beer',
      },
      {
        title: 'Collector Items',
        description:
          'Craft beer fans collect these. Limited-edition tin tackers for seasonal releases or anniversary beers become instant keepsakes that fans hunt down.',
        icon: 'beer',
      },
    ],
    recommendedProducts: [
      {
        name: '22" Bottle Cap Tacker',
        slug: '22-inch-bottle-cap-tacker',
        description: 'The classic brewery look. Giant bottle cap shape that screams craft beer.',
        shape: 'Bottle Cap',
      },
      {
        name: '14" Bottle Cap Tacker',
        slug: '14-inch-bottle-cap-tacker',
        description: 'Same iconic shape, smaller footprint. Great for crowded tap walls.',
        shape: 'Bottle Cap',
      },
      {
        name: '11" x 22" Large Can Tacker',
        slug: '11x22-large-can-tacker',
        description: 'Shaped like a tall boy can. Perfect for breweries pushing cans over bottles.',
        shape: 'Can',
      },
      {
        name: '18" Circle Tacker',
        slug: '18-inch-circle-tacker',
        description: 'Clean round shape that works for any logo or label design.',
        shape: 'Circle',
      },
    ],
    useCases:
      'Hang them in your taproom, hand them out at beer festivals, give them to your distributors, sell them in your merch shop, or send them as gifts to loyal accounts.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your brewery signs?',
    metaTitle: 'Custom Tin Tacker Signs for Breweries | Embossed Aluminum Brewery Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for your brewery. Bottle cap, can shape, and circle tin tackers perfect for taprooms, beer festivals, and distributor swag. Made in USA. 25 minimum order.',
    keywords: [
      'brewery signs',
      'custom brewery signs',
      'tin tacker brewery',
      'craft beer signs',
      'taproom signs',
      'beer tin tackers',
      'brewery wall art',
      'bottle cap signs',
      'craft brewery signage',
      'beer festival signs',
      'brewery tin tacker signs',
      'custom beer signs',
    ],
    breadcrumbLabel: 'Brewery Signs',
  },

  // ─── BAR SIGNS ────────────────────────────────────────────────────────
  {
    slug: 'bar-signs',
    name: 'Bars & Pubs',
    headline: 'Tin Tackers That Belong Behind the Bar',
    heroSubtext:
      'Every great bar has that wall. The one covered in signs, stickers, and memories. Custom tin tackers are the centerpiece — embossed, full-color, and built to outlast every happy hour.',
    benefits: [
      {
        title: 'Bar Wall Decor',
        description:
          'A bare wall is a missed opportunity. Tin tackers fill it with personality and brand presence. Stack different sizes for that classic dive bar or craft cocktail vibe.',
        icon: 'glass',
      },
      {
        title: 'Brand Visibility',
        description:
          'Beverage brands use tin tackers to mark their territory. Get your sign on the wall and every customer sees your brand while they order another round.',
        icon: 'glass',
      },
      {
        title: 'Event & Promo Signage',
        description:
          'Trivia night? New cocktail menu? Anniversary party? Tin tackers make every event feel more official. Hang them up, leave them up — they last forever.',
        icon: 'glass',
      },
      {
        title: 'Customer Giveaways',
        description:
          'Regulars love free stuff. But they love cool free stuff even more. A custom tin tacker ends up on their garage wall, man cave, or home bar — keeping your brand visible 24/7.',
        icon: 'glass',
      },
    ],
    recommendedProducts: [
      {
        name: '12" x 18" Rectangle Tacker',
        slug: '12x18-rectangle-tacker',
        description: 'Classic bar sign shape. Big enough to read, small enough to fit anywhere.',
        shape: 'Rectangle',
      },
      {
        name: '11" x 18" Arrow Tacker',
        slug: '11x18-arrow-tacker',
        description: 'Point customers to the bar, the patio, or the good times. Arrows just work.',
        shape: 'Arrow',
      },
      {
        name: '18" Square Tacker',
        slug: '18-inch-square-tacker',
        description: 'Bold and balanced. Works for logos, drink specials, or house rules.',
        shape: 'Square',
      },
      {
        name: '24" x 5" Street Sign Tacker',
        slug: '24x5-street-sign-tacker',
        description: 'Name your bar street. "Happy Hour Ave" has a nice ring to it.',
        shape: 'Street Sign',
      },
    ],
    useCases:
      'Cover your bar walls, mark the entrance, decorate the patio, give them to regulars, or hand them out during promotional events and grand openings.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your bar signs?',
    metaTitle: 'Custom Tin Tacker Signs for Bars & Pubs | Embossed Aluminum Bar Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for your bar, pub, or tavern. Rectangle, arrow, and square shapes perfect for bar wall decor, promotions, and brand signage. Made in USA.',
    keywords: [
      'bar signs',
      'custom bar signs',
      'tin tacker bar',
      'pub signs',
      'tavern signs',
      'bar wall decor',
      'bar tin tackers',
      'custom pub signs',
      'bar wall signs',
      'beer bar signs',
      'cocktail bar signs',
      'bar signage',
    ],
    breadcrumbLabel: 'Bar Signs',
  },

  // ─── CANNABIS SIGNS ───────────────────────────────────────────────────
  {
    slug: 'cannabis-signs',
    name: 'Cannabis & CBD',
    headline: 'Tin Tackers for the Cannabis Industry',
    heroSubtext:
      'Dispensaries, brands, and CBD companies — your brand needs to stand out in a crowded market. Custom tin tackers give you that premium, tangible presence that digital ads just can not match.',
    benefits: [
      {
        title: 'Dispensary Displays',
        description:
          'Make your dispensary walls pop. Tin tackers add a premium, established feel to any retail space. They tell customers you are the real deal, not a pop-up shop.',
        icon: 'leaf',
      },
      {
        title: 'Brand Awareness',
        description:
          'In a market where packaging gets thrown away, tin tackers stick around. Literally. They hang on walls for years, keeping your brand in front of customers long after the purchase.',
        icon: 'leaf',
      },
      {
        title: 'Event & Trade Show Swag',
        description:
          'Cannabis events and trade shows are packed. Stand out with swag that does not end up in the trash. Tin tackers get kept, displayed, and talked about.',
        icon: 'leaf',
      },
      {
        title: 'Retailer & Partner Gifts',
        description:
          'Send a tin tacker to your retail partners and dispensary accounts. It goes up on their wall, and suddenly every customer who walks in sees your brand.',
        icon: 'leaf',
      },
    ],
    recommendedProducts: [
      {
        name: '18" Square Tacker',
        slug: '18-inch-square-tacker',
        description: 'Clean, modern shape that works perfectly for cannabis brand logos.',
        shape: 'Square',
      },
      {
        name: '12" Circle Tacker',
        slug: '12-inch-circle-tacker',
        description: 'Round shape for a softer, approachable look. Great for CBD brands.',
        shape: 'Circle',
      },
      {
        name: '12" x 18" Rectangle Tacker',
        slug: '12x18-rectangle-tacker',
        description: 'Vertical or horizontal. Versatile enough for any strain graphic or brand layout.',
        shape: 'Rectangle',
      },
      {
        name: 'Custom Shape Tacker',
        slug: 'custom-shape-tacker',
        description: 'Leaf shape? Your mascot? Go fully custom and own a shape no one else has.',
        shape: 'Custom Die-Cut',
      },
    ],
    useCases:
      'Deck out your dispensary, hand them out at cannabis cups and trade shows, send them to retail partners, use them as limited-edition drops for loyal customers, or sell them as branded merch.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your cannabis brand signs?',
    metaTitle: 'Custom Tin Tacker Signs for Cannabis & Dispensaries | Embossed Aluminum Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for dispensaries, cannabis brands, and CBD companies. Square, circle, and custom die-cut shapes. Premium brand signage made in USA.',
    keywords: [
      'cannabis signs',
      'dispensary signs',
      'custom cannabis signs',
      'CBD signs',
      'tin tacker cannabis',
      'dispensary wall signs',
      'cannabis brand signs',
      'marijuana signs',
      'hemp signs',
      'cannabis tin tackers',
      'dispensary decor',
      'custom dispensary signs',
    ],
    breadcrumbLabel: 'Cannabis Signs',
  },

  // ─── RESTAURANT SIGNS ─────────────────────────────────────────────────
  {
    slug: 'restaurant-signs',
    name: 'Restaurants',
    headline: 'Tin Tackers for Restaurants & Food Brands',
    heroSubtext:
      'Your restaurant has a vibe. Custom tin tackers amplify it. Whether you are a BBQ joint, taco truck, or fine dining spot — embossed aluminum signs add character that paint and posters never could.',
    benefits: [
      {
        title: 'Restaurant Decor',
        description:
          'Tin tackers add instant personality to any dining space. Hang your logo, your signature dish, or your house motto on the wall. Way cooler than a framed print.',
        icon: 'utensils',
      },
      {
        title: 'Food Truck Branding',
        description:
          'Food trucks need to be noticed. A tin tacker mounted on the truck or handed out to fans turns every parking lot into a marketing opportunity.',
        icon: 'utensils',
      },
      {
        title: 'Menu Highlights',
        description:
          'Got a famous burger? A secret sauce? Make a sign for it. Tin tackers for signature items double as decor and marketing — and customers love photographing them.',
        icon: 'utensils',
      },
      {
        title: 'Franchise & Multi-Location',
        description:
          'Keep the look consistent across locations. Tin tackers are easy to ship, easy to hang, and they give every location that branded, on-brand feel from day one.',
        icon: 'utensils',
      },
    ],
    recommendedProducts: [
      {
        name: '12" x 18" Rectangle Tacker',
        slug: '12x18-rectangle-tacker',
        description: 'Classic sign shape. Perfect for menu features, house rules, or logo displays.',
        shape: 'Rectangle',
      },
      {
        name: '15" Square Tacker',
        slug: '15-inch-square-tacker',
        description: 'Balanced size that fits on any wall without overwhelming the space.',
        shape: 'Square',
      },
      {
        name: '11" x 18" Arrow Tacker',
        slug: '11x18-arrow-tacker',
        description: 'Point to the kitchen, the patio, or the restrooms with style.',
        shape: 'Arrow',
      },
      {
        name: '15" x 4" Street Sign Tacker',
        slug: '15x4-street-sign-tacker',
        description: 'Name your signature dishes or dining areas. "Smoker Lane" anyone?',
        shape: 'Street Sign',
      },
    ],
    useCases:
      'Decorate your dining room, outfit your food truck, mark different dining areas, hand them out at grand openings, or ship them to franchise locations for consistent branding.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your restaurant signs?',
    metaTitle: 'Custom Tin Tacker Signs for Restaurants | Embossed Aluminum Restaurant Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for restaurants, food trucks, and food brands. Rectangle, square, and arrow shapes for restaurant decor and branding. Made in USA.',
    keywords: [
      'restaurant signs',
      'custom restaurant signs',
      'tin tacker restaurant',
      'food truck signs',
      'restaurant wall decor',
      'restaurant tin tackers',
      'food brand signs',
      'restaurant signage',
      'custom food signs',
      'BBQ signs',
      'diner signs',
      'restaurant wall art',
    ],
    breadcrumbLabel: 'Restaurant Signs',
  },

  // ─── COFFEE SIGNS ─────────────────────────────────────────────────────
  {
    slug: 'coffee-signs',
    name: 'Coffee & Tea',
    headline: 'Tin Tackers for Coffee Roasters & Cafes',
    heroSubtext:
      'Your coffee shop has more personality than a chain ever will. Custom tin tackers let you show it off — embossed aluminum signs that feel as warm and crafted as your best pour-over.',
    benefits: [
      {
        title: 'Cafe Wall Art',
        description:
          'Every indie coffee shop needs that wall. The one with the character. Tin tackers bring that vintage, handcrafted feel that matches your carefully curated playlist and latte art.',
        icon: 'coffee',
      },
      {
        title: 'Roaster Branding',
        description:
          'Selling beans wholesale? Send a tin tacker to every cafe that carries your roast. Your brand gets wall space in their shop — that is advertising you could not buy.',
        icon: 'coffee',
      },
      {
        title: 'Merch & Retail',
        description:
          'Customers already buy your mugs and tees. A tin tacker is the next level. Sell them at the counter or bundle them with bean subscriptions for a premium touch.',
        icon: 'coffee',
      },
      {
        title: 'Event Signage',
        description:
          'Farmers markets, pop-ups, and coffee festivals — a tin tacker on your booth makes you look established and serious. Way better than a printed banner.',
        icon: 'coffee',
      },
    ],
    recommendedProducts: [
      {
        name: '14" Circle Tacker',
        slug: '14-inch-circle-tacker',
        description: 'Round like a coffee cup rim. Clean and classic for roaster logos.',
        shape: 'Circle',
      },
      {
        name: '12" Square Tacker',
        slug: '12-inch-square-tacker',
        description: 'Compact square that fits anywhere — behind the espresso machine, by the door.',
        shape: 'Square',
      },
      {
        name: '8" x 12" Rectangle Tacker',
        slug: '8x12-rectangle-tacker',
        description: 'Small enough for tight spaces, big enough to make a statement.',
        shape: 'Rectangle',
      },
      {
        name: '12" x 6" License Plate',
        slug: '12x6-license-plate',
        description: 'Fun, compact shape. Perfect for coffee origin stories or blend names.',
        shape: 'License Plate',
      },
    ],
    useCases:
      'Hang them in your cafe, send them to wholesale accounts, sell them as merch, use them at farmers markets, or gift them to loyal regulars who always order the same thing.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your coffee shop signs?',
    metaTitle: 'Custom Tin Tacker Signs for Coffee Shops & Roasters | Embossed Aluminum Cafe Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for coffee roasters, cafes, and tea shops. Circle, square, and rectangle shapes for cafe decor and roaster branding. Made in USA.',
    keywords: [
      'coffee shop signs',
      'custom cafe signs',
      'tin tacker coffee',
      'coffee roaster signs',
      'cafe wall art',
      'coffee tin tackers',
      'tea shop signs',
      'coffee brand signs',
      'cafe signage',
      'coffee house decor',
      'roaster branding signs',
      'custom coffee signs',
    ],
    breadcrumbLabel: 'Coffee Signs',
  },

  // ─── SPORTS SIGNS ─────────────────────────────────────────────────────
  {
    slug: 'sports-signs',
    name: 'Sports & Teams',
    headline: 'Tin Tackers for Sports Teams & Fan Caves',
    heroSubtext:
      'From pro stadiums to backyard fan caves — custom tin tackers turn any space into the ultimate sports shrine. Embossed aluminum signs that are as tough as your team.',
    benefits: [
      {
        title: 'Stadium & Arena Signage',
        description:
          'Concourses, suites, and concession areas — tin tackers add branded touchpoints throughout the venue without the cost of permanent installations.',
        icon: 'trophy',
      },
      {
        title: 'Fan Cave Must-Haves',
        description:
          'Every fan cave needs signs. Tin tackers are the go-to for sports fans decorating their basements, garages, and bars. They look authentic and last forever.',
        icon: 'trophy',
      },
      {
        title: 'Team Merchandise',
        description:
          'Sell them in the team store or online shop. Tin tackers are lightweight, shippable, and have way better margins than most merch. Fans collect them by season.',
        icon: 'trophy',
      },
      {
        title: 'Sports Bar Partnerships',
        description:
          'Team up with local sports bars. Send them tin tackers and they will hang them proudly — putting your brand in front of every game-day crowd.',
        icon: 'trophy',
      },
    ],
    recommendedProducts: [
      {
        name: '24" Square Tacker',
        slug: '24-inch-square-tacker',
        description: 'Big, bold, and impossible to miss. The centerpiece of any fan cave.',
        shape: 'Square',
      },
      {
        name: 'Interstate Shield Sign',
        slug: 'interstate-shield-sign',
        description: 'Classic shield shape. Perfect for team crests, logos, and championship years.',
        shape: 'Shield',
      },
      {
        name: '22" Bottle Cap Tacker',
        slug: '22-inch-bottle-cap-tacker',
        description: 'Iconic round shape with a twist. Great for sports bar crossover branding.',
        shape: 'Bottle Cap',
      },
      {
        name: '12" x 24" Rectangle Tacker',
        slug: '12x24-rectangle-tacker',
        description: 'Wide format for team schedules, championship banners, or roster displays.',
        shape: 'Rectangle',
      },
    ],
    useCases:
      'Outfit your stadium concourse, stock the team store, send them to partner sports bars, sell them on your website, or create limited-edition championship and season commemoratives.',
    pricingStart: '$3.50',
    ctaText: 'Ready to make your sports team signs?',
    metaTitle: 'Custom Tin Tacker Signs for Sports Teams | Embossed Aluminum Sports Signs',
    metaDescription:
      'Order custom embossed aluminum tin tacker signs for sports teams, stadiums, and fan caves. Square, shield, and rectangle shapes for team merch and sports bar decor. Made in USA.',
    keywords: [
      'sports signs',
      'custom sports signs',
      'tin tacker sports',
      'team signs',
      'stadium signs',
      'fan cave signs',
      'sports bar signs',
      'sports tin tackers',
      'team merchandise signs',
      'custom team signs',
      'sports wall art',
      'game day signs',
    ],
    breadcrumbLabel: 'Sports Signs',
  },
];

export function getIndustryBySlug(slug: string): IndustryData | undefined {
  return industries.find((i) => i.slug === slug);
}
