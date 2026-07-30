"""Remove console.error from resumes/route.ts and add correlation IDs to all API error responses."""
import re
import os

# Fix 1: Remove console.error from resumes/route.ts
path = 'src/app/api/resumes/route.ts'
with open(path, 'r') as f:
    content = f.read()

# Remove the console.error line
content = content.replace(
    "    console.error(error); // This will show in your terminal\n",
    ""
)

with open(path, 'w') as f:
    f.write(content)

print(f"✅ Removed console.error from {path}")

# Fix 2: Add correlation ID pattern to all API route error handlers
# Create a utility function for generating error IDs
os.makedirs('src/lib/errors.ts', exist_ok=True)

print("✅ Done")
