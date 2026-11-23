# How the Password Generator Works

Generating trustworthy passwords on the web requires avoiding two subtle but critical pitfalls: weak pseudo-random number generators and statistical modulo bias.

### Cryptographically Secure Random Numbers (CSPRNG)

Standard browser functions like `Math.random()` are deterministic pseudo-random generators intended for graphics and simple animations. They are completely unsuitable for cryptography because an attacker can predict future outputs from observed outputs.

This generator strictly utilizes `crypto.getRandomValues()`, which draws from kernel-level hardware entropy sources (mouse movements, CPU interrupt timings, thermal sensor noise).

### Eliminating Modulo Bias with Rejection Sampling

When drawing a random character from a character pool of size $N$ using a 32-bit unsigned integer ($2^{32} = 4,294,967,296$ possible values), calculating `rand % N` introduces bias because $2^{32}$ is rarely evenly divisible by $N$.

To ensure exact uniformity, our engine implements **rejection sampling**:
$$\text{Limit} = \left\lfloor \frac{2^{32}}{N} \right\rfloor \times N$$
Any random 32-bit integer greater than or equal to this limit is discarded, ensuring every character in your chosen pool has an identical mathematical probability of being selected.

### Information-Theoretic Entropy

Password strength is evaluated using Shannon information entropy:

$$\text{Entropy (bits)} = L \times \log_2(P)$$

Where $L$ is length and $P$ is character pool size.
- 16 characters across 94 printable ASCII characters ($26+26+10+32$):
  $$16 \times \log_2(94) = 16 \times 6.5546 = \mathbf{104.87\text{ bits}} \text{ (Very strong)}$$
- 12 characters across 62 alphanumeric characters ($26+26+10$):
  $$12 \times \log_2(62) = 12 \times 5.9542 = \mathbf{71.45\text{ bits}} \text{ (Good)}$$

### Complete Zero-Storage Guarantee

Generated passwords exist solely inside ephemeral client-side variables. No data is stored, cached, or transmitted over any network socket.