// utils/categoryConfig.js
const subcategories = {
    housing: [
        'Mortgage',
        'Insurance',
        'Property Rates',
        'Water Bill',
        'Land Tax',
        'Maintenance',
        'Compliance Fees',
        'Body Corporate Fees'
    ],
    food: [
        'Groceries',
        'Dining Out',
        'Takeaway',
        'Coffee/Snacks'
    ],
    transportation: [
        'Car Loan',
        'Insurance',
        'Registration',
        'Fuel',
        'Maintenance & Repairs',
        'Public Transport',
        'Tolls & Parking',
        'Ride-Sharing & Taxis'
    ],
    utilities: [
        'Electricity Bill',
        'Gas Bill',
        'Water Bill',
        'Internet',
        'Mobile (Self)',
        'Mobile (Bachha)'
    ],
    healthcare: [
        'Health Insurance',
        'Doctor Visits',
        'Dentist',
        'Pharmacy',
        'Specialist Consultations',
        'Vision Care'
    ],
    entertainment: [
        'Subscriptions',
        'Movies & Shows',
        'Concerts & Events',
        'Memberships',
        'Hobbies & Leisure Activities'
    ],
    education: [
        'School Fees',
        'Books & Stationery',
        'Kids\' Classes',
        'Online Courses',
        'Tuition Fees'
    ],
    personal: [
        'Gym Membership',
        'Personal Care',
        'Clothing & Shopping',
        'Gifts & Donations'
    ],
    travel: [
        'Domestic Travel',
        'Overseas Travel',
        'Accommodation',
        'Flights & Transport',
        'Travel Insurance'
    ],
    other: [
        'Miscellaneous Expenses',
        'Fines',
        'Unexpected Expenses'
    ]
};

// List of all main categories
const categories = [
    { value: 'housing', label: 'Housing' },
    { value: 'food', label: 'Food' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'education', label: 'Education' },
    { value: 'personal', label: 'Personal' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
];

module.exports = { subcategories, categories };