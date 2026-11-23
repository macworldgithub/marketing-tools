# How Address Generator Works

The Address Generator creates syntactically valid placeholder addresses across multiple countries for user interface prototyping, form validation testing, and database population.

## Regional Formatting Standards
Instead of producing random text strings, this tool applies geographic formatting rules tailored to each country:
- **United States:** Follows the USPS standard `Street, City, State ZIP`. Crucially, ZIP codes are constrained by state-specific postal prefix ranges. For example, a California address will strictly receive a 5-digit ZIP within the 90001–96162 range, while New York receives 10001–14925, and Texas receives 75001–79999.
- **United Kingdom:** Uses the British alphanumeric postcode structure (`Outward District + Inward Unit`, such as `NW1 6XE` or `M1 4ET`) paired with authentic municipality and county pairings.
- **Canada:** Follows Canada Post Forward Sortation Area (FSA) and Local Delivery Unit (LDU) conventions (`A1A 1A1`).
- **Australia & India:** Adheres to Australian 4-digit state postal bands (e.g. 2000 for Sydney NSW, 3000 for Melbourne VIC) and Indian 6-digit Postal Index Numbers (PIN codes).

## Deterministic Seeding and CSV Export
Automated testing pipelines often require reproducible fixtures across test suites. Supplying an optional integer seed initializes a Mulberry32 pseudorandom engine, guaranteeing identical address sequences across multiple automated test runs. Users can export generated datasets directly to structured CSV format for bulk importing into PostgreSQL, MySQL, SQLite, or mock API servers.

## Safety and Testing Ethics
Generated addresses are explicitly intended as non-functional mock data for software staging environments, layout mockups, and database testing. They are not physical delivery points and should never be used for real order processing, identity registration, or legal paperwork. All data generation occurs 100% locally in your browser with zero network transmission.