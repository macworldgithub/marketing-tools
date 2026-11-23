# How Strong Password Generator Works

The Strong Password Generator creates high-entropy credentials locally using the browser Cryptographically Secure Pseudorandom Number Generator (`crypto.getRandomValues`).

## Information Entropy & Strength Ratings
The theoretical strength of a password generated uniformly at random is measured in bits of Shannon entropy:
$$\text{Entropy} = L \times \log_2(N)$$
where $L$ is the credential length and $N$ is the total pool of eligible characters. For instance:
- **Length 12 over 62 alphanumeric characters:** $12 \times \log_2(62) = 71.45\text{ bits}$ (Good)
- **Length 16 over 94 ASCII printable characters:** $16 \times \log_2(94) = 104.87\text{ bits}$ (Very Strong)
- **6 words chosen from a 7,776-word dictionary:** $6 \times \log_2(7776) = 77.55\text{ bits}$ (Good)

Passwords with entropy $\ge 100\text{ bits}$ are mathematically invulnerable to offline dictionary or GPU brute-force attacks across billions of years.

## Rejection Sampling & Zero Modulo Bias
A common security vulnerability in naive password generators is utilizing the modulo operator (`rand % poolSize`), which creates modulo bias when the random integer range is not an exact multiple of the pool size. Our implementation applies rejection sampling: any raw random integer exceeding the largest whole multiple of the pool size is discarded and sampled again, ensuring an identical mathematical probability for every character.

## Guaranteed Character Distribution
When multiple character sets (uppercase, lowercase, digits, symbols) are checked, the generator guarantees that at least one character from each category is included. All characters are subsequently scrambled using the Fisher-Yates shuffle driven by the same CSPRNG source.

## Absolute Local Isolation
Traditional online password generators expose generated passwords to server access logs or external transit intercepts. This utility guarantees zero network transmission: the browser Web Crypto API generates all entropy directly on your physical hardware. Generated passwords are never saved to local storage, cookies, or telemetry streams, allowing security-conscious teams to generate credentials with absolute operational assurance.