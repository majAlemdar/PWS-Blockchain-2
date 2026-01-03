# PWS-Blockchain-2
PWS Blockchain tweede deelvraag
- Dowload node.js.
- cd project, npm install the node_modules.
- To run a "node", see package.json>"scripts", f.e. "npm run node_1".
- You have to run "npm run node_1", this is the "fixed node" of Bascoin.
- If cmd doesn't let you run multiple cli's --> "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass". After this command, temporary, you can run commands in multiple cli's.
- The main page of a node is: "http://localhost:${PORT}". ${PORT} can be 3001, 3002, 3003 or 3004. It depends on which 'nodes' you run (see scripts in package.json).
- If the "transaction" is not in the mempool on the first attempt, reload the page and try again, due to --watch flag in nodeJS.
