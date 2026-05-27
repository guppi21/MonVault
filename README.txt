MONVAULT QUICK SETUP

1. Replace your current:
app/page.js

with the new page.js file.

2. Find this line:

const CONTRACT_ADDRESS = "PASTE_YOUR_CONTRACT_ADDRESS_HERE";

3. Paste your deployed contract address there.

4. Install packages:

npm install ethers axios

5. Create:
.env.local

Add:

NEXT_PUBLIC_PINATA_JWT=YOUR_PINATA_JWT

6. Push to GitHub:

git add .
git commit -m "MonVault upgraded"
git push

7. Vercel auto deploys your changes.
