import os

filepath = "frontend/components/torneos/FixtureTab.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Replace e: any
content = content.replace('catch (e: any)', 'catch (error)')
content = content.replace('e.message', 'getErrorMessage(error)')

if 'getErrorMessage' not in content:
    content = 'import { getErrorMessage } from "@/lib/api-client"\n' + content

with open(filepath, 'w') as f:
    f.write(content)
