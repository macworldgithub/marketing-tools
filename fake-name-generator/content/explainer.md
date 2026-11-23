# How Fake Name Generator Works

The Fake Name Generator synthesizes authentic-sounding fictional identities for software testing, automated QA pipelines, and design prototypes.

## Cultural Name Modeling
Rather than calling third-party mock data services that can leak test requests, this utility bundles static linguistic dictionaries containing hundreds of verified given names and surnames across six major countries:
- **United States & Canada:** Comprehensive blend of contemporary Anglo-Saxon, Latin, and international demographic names.
- **United Kingdom & Australia:** Traditional and modern regional naming distributions.
- **India & Pakistan:** Culturally authentic regional given names and surnames reflecting South Asian naming conventions.

## Safe-By-Design Principles
1. **RFC 2606 Reserved Domains:** All mock email addresses strictly utilize the reserved domain extensions `@example.com`, `@example.org`, and `@example.net`. These domains are hard-coded in internet routing protocols never to deliver mail, preventing accidental spam delivery.
2. **Designated Fictional Numbers:** United States and Canadian telephone numbers strictly fall within the North American Numbering Plan (NANP) fictional allocation range `555-0100` through `555-0199`.
3. **Strict Ban on PII:** This tool does not generate Social Security numbers, tax identifiers, passport credentials, or payment cards.

## Deterministic Seeding & Export
For automated end-to-end testing, entering an integer seed initializes a Mulberry32 pseudorandom number generator. This guarantees reproducible sequences of test fixtures across test runs. Data can be exported to JSON or CSV format with a single click.

## Practical Use Cases in Software Development
Development teams utilize mock identity records to populate relational databases, test complex form validations, verify international character encoding in name fields, and generate realistic sample data for stakeholder product demonstrations. Because names are drawn from authentic linguistic pools rather than random alphanumeric strings, prototype interfaces feel polished and user-friendly during user testing sessions.