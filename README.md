<img width="845" height="217" alt="Screenshot 2025-07-10 at 9 38 03 PM" src="https://github.com/user-attachments/assets/4a257d53-8161-4a61-bca4-febdbd8f7a40" />
# Claude Screen Reader
- Allows Anthropic Claude to view your screen and answer questions.
- Contains both a Chrome extension that allows Claude to view your tabs, and a Notability clone that allows Claude to view your notetaking and help answer questions.
- Uses the Anthropic App and not the API, allowing you to ask questions for free.
<img width="1183" alt="claudeMCPKhanAcademyDemo" src="https://github.com/user-attachments/assets/8426729b-d701-478a-b9e3-6a7d24704ef9" />


# Setup w/ Claude Desktop Client

0) Make sure NPM / Node.js is installed.
1) Install Claude Desktop App
2) Open settings (Cmd + ,)
3) Go to Developer tab
4) Click Edit Config
5) Edit the file to what is in `claude_desktop_config.example.json` (Make sure to update your path)
6) Run `npm i` in the `mcp-server` directory to get packages installs.
7) Edit the user ID in the `mcp-server/server.js` file to your id
8) Restart the Claude Desktop App

9) Talk to Claude! Ask it whats on your screen :)

#### A Few Troubleshooting Tips:
- Claude can only see what you have open in Google Chrome. So for example, if the Slack app is open, Claude won't be able to see it. But if you go to the Slack mobile site, it will be able to see the webpage contents.
-  The Chrome extension may not run if you click out of Chrome. If you click on the Calude app and enter a prompt, and it seems to be taking a long time to run the function to look at your screen, you may need to click on your Google Chrome window to allow the Chrome Extension to run and see your screen.
- Even though Claude has the ability to see your screen, it sometimes  doesn't use that access and doesn't look at your screen. If Claude is having trouble responding, try explicitly telling Claude to look at your screen in your prompt, for example: "Could you please take a look at my screen and help me with..."
