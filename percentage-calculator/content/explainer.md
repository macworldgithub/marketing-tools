# How the Percentage Calculator Works

Percentages represent dimensionless ratios expressed as fractions of 100 (from the Latin *per centum*, meaning "by the hundred"). While fundamental to finance, science, and retail, different percentage questions require distinct mathematical formulations.

### 1. Percentage of a Value
$$\text{Result} = Y \times \frac{X}{100}$$
*Example:* 15% of 200 = $200 \times 0.15 = \mathbf{30}$.

### 2. What Percentage Is X of Y?
$$\text{Percentage} = \frac{X}{Y} \times 100 \quad (Y \neq 0)$$
*Example:* 30 is what percent of 200? $\frac{30}{200} \times 100 = \mathbf{15\%}$.

### 3. X Is Y% of What Base?
$$\text{Base} = \frac{X \times 100}{Y} \quad (Y \neq 0)$$
*Example:* 30 is 15% of what? $\frac{30 \times 100}{15} = \mathbf{200}$.

### 4. Percentage Increase and Decrease
$$\text{Result} = Y \times \left(1 \pm \frac{X}{100}\right)$$
*Example:* Increase 200 by 15% = $200 \times 1.15 = \mathbf{230}$.

### 5. Percentage Change (Directional)
$$\text{Percentage Change} = \frac{B - A}{|A|} \times 100 \quad (A \neq 0)$$
*Examples:*
- From 50 to 75: $\frac{75 - 50}{50} \times 100 = \mathbf{+50\%}$ (Increase)
- From 75 to 50: $\frac{50 - 75}{75} \times 100 = \mathbf{-33.3333\%}$ (Decrease)

### 6. Percentage Difference (Symmetric)
Unlike percentage change, percentage difference compares two unordered values against their arithmetic mean:
$$\text{Difference} = \frac{|A - B|}{\frac{A + B}{2}} \times 100 \quad (A + B \neq 0)$$
*Example:* Comparing 50 and 75: $\frac{|50 - 75|}{62.5} \times 100 = \mathbf{40\%}$. Because it is symmetric, comparing 75 vs 50 yields the identical 40%.

### Decimal Precision

All operations are executed via `decimal.js` with up to 6 significant digits and automatic trimming of trailing zeros, eliminating binary representation artifacts.