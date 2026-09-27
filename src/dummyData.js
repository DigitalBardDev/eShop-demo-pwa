export const dummyInventory = [
  {
    id: 1,
    make_model: "Classic Leather Backpack",
    brand: "Aura",
    model: "Explorer",
    price: 120.00,
    inventory_status: "available",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image_urls: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80"],
    condition_description: "New",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    make_model: "Minimalist Chronograph Watch",
    brand: "Aura",
    model: "Timepiece 1",
    price: 250.00,
    inventory_status: "available",
    description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    image_urls: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80"],
    condition_description: "New",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    make_model: "Noise-Cancelling Headphones",
    brand: "Aura",
    model: "Sonic Pro",
    price: 199.99,
    inventory_status: "sold",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    image_urls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"],
    condition_description: "Like New",
    created_at: new Date().toISOString()
  }
];

export const dummyReviews = [
  {
    id: 1,
    author_name: "Alex J.",
    status: "approved",
    rating: 5,
    review_text: "Absolutely love my new backpack! The quality is fantastic and shipping was surprisingly fast. Highly recommend this store.",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    author_name: "Sam T.",
    status: "approved",
    rating: 4,
    review_text: "Great watch, looks exactly like the pictures. Lorem ipsum dolor sit amet. Will definitely shop here again.",
    created_at: new Date().toISOString()
  }
];

export const dummyInquiries = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0100",
    budget: "$500",
    message: "I am looking for a vintage camera.",
    created_at: new Date().toISOString()
  }
];

export const dummyQuestions = [
  {
    id: 1,
    item_id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    question: "Is the watch water-resistant?",
    created_at: new Date().toISOString()
  }
];

export const dummyMetrics = [
  { id: 1, event_type: "page_view", path: "/", created_at: new Date().toISOString() },
  { id: 2, event_type: "page_view", path: "/item/1", created_at: new Date().toISOString() },
];
