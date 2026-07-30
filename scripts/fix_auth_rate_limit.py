"""Add rate limiting import and check to NextAuth authorize callback."""
import re

with open('src/lib/auth.ts', 'r') as f:
    content = f.read()

# 1. Add rate-limit import
old_import = "import { createServerSupabaseClient } from \"@/lib/supabase/server\";"
new_import = old_import + '\nimport { checkRateLimit } from \"@/lib/rate-limit\";'
content = content.replace(old_import, new_import)

# 2. Add rate limiting at the start of authorize function
old_authorize = """      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = await createServerSupabaseClient();"""

new_authorize = """      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 5 login attempts per minute per email
        const allowed = await checkRateLimit(`login:${credentials.email}`, 5, 60000);
        if (!allowed) {
          return null;
        }

        const supabase = await createServerSupabaseClient();"""

content = content.replace(old_authorize, new_authorize)

with open('src/lib/auth.ts', 'w') as f:
    f.write(content)

print("✅ Rate limiting added to login authorize function")
