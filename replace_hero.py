import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add import
import_stmt = 'import dynamic from "next/dynamic";\nconst Hero3DScene = dynamic(() => import("@/components/home/Hero3DScene").then((mod) => mod.Hero3DScene), { ssr: false });\n'
content = content.replace('import { Footer } from "@/components/layout/Footer";', 'import { Footer } from "@/components/layout/Footer";\n' + import_stmt)

# 2. Replace TiltCard and its children with Hero3DScene
# We'll use regex to find <TiltCard> ... </TiltCard> inside the right hero section.
# We know it starts right after <motion.div ... className="w-full max-w-[640px] ml-auto relative">
# The first instance of <TiltCard> after Hero Content

start_str = 'className="w-full max-w-[640px] ml-auto relative"\n            >'
end_str = '            </motion.div>\n            \n            {/* Connected Accounts Pill */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx + len(start_str)] + '\n              <Hero3DScene />\n' + content[end_idx:]
    with open('src/app/page.tsx', 'w') as f:
        f.write(new_content)
    print("Replacement successful")
else:
    print("Could not find boundaries")
