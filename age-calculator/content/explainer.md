# How the Age Calculator Works

Determining an individual's exact chronological age seems deceptively simple, yet calendar variations—such as differing month lengths (28, 29, 30, or 31 days) and quadrennial leap years—require rigorous mathematical logic.

### Chronological Algorithm & End-of-Month Clamping

To prevent anomalies (such as claiming someone born on January 31 is 1 month and -2 days old on March 1), this calculator implements standard calendar end-of-month clamping:

1. **Month Differential:**
   We compute the total gross elapsed months:
   `m = (targetYear - fromYear) * 12 + (targetMonth - fromMonth)`
2. **Boundary Adjustment:**
   If the target day is less than the minimum of the birth day and the maximum days in the target month:
   `m = m - 1`
3. **Years and Months Breakdown:**
   `years = floor(m / 12)`
   `months = m % 12`
4. **Anchor Date & Day Count:**
   An intermediate anchor date is established by advancing the birth date by `m` months, clamping the day to the maximum days in that anchor month:
   `anchorDay = min(fromDay, daysInMonth(anchorYear, anchorMonth))`
   The remaining days are calculated as the exact days between the anchor date and the target date.

### Leap Year & February 29 Rule

For people born on February 29, non-leap years do not contain a 29th day of February. In accordance with standard legal and civil conventions, February 28 is treated as the anniversary date during common years.

### Absolute Client-Side Privacy

Date of birth is sensitive personal data. This calculator executes entirely within your browser's local memory. No dates or calculation results are ever transmitted across network connections.