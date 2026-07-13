import re

with open('src/server.ts', 'r') as f:
    lines = f.readlines()

start_idx = 17
end_idx = 1066

api_lines = lines[start_idx:end_idx]

# replace app.get, app.post, etc with apiRouter.get, etc.
new_api_lines = []
for line in api_lines:
    line = re.sub(r'app\.(get|post|put|patch|delete)\(', r'apiRouter.\1(', line)
    # remove /api from paths since router is mounted at /api
    line = re.sub(r'apiRouter\.(get|post|put|patch|delete)\(\'/api/', r"apiRouter.\1('/", line)
    new_api_lines.append(line)
    
api_file_content = "import express from 'express';\nimport { join } from 'node:path';\nimport fs from 'node:fs';\n\nexport const apiRouter = express.Router();\n\n" + "".join(new_api_lines)

with open('src/server/api.ts', 'w') as f:
    f.write(api_file_content)

server_ts_new = "".join(lines[:start_idx]) + "\nimport { apiRouter } from './server/api';\napp.use('/api', apiRouter);\n\n" + "".join(lines[end_idx:])

with open('src/server.ts', 'w') as f:
    f.write(server_ts_new)
    
print("Extraction successful.")
