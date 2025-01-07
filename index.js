import { Octokit } from "@octokit/core";
import express from "express";
import { Readable } from "node:stream";

const app = express()

app.get("/", (req, res) => {
  res.send("Ahoy, matey! Welcome to the Blackbeard Pirate GitHub Copilot Extension!")
});

app.post("/", express.json(), async (req, res) => {
  // Identify the user, using the GitHub API token provided in the request headers.
  const tokenForUser = req.get("X-GitHub-Token");
  const octokit = new Octokit({ auth: tokenForUser });
  const user = await octokit.request("GET /user");
  console.log("User:", user.data.login);

  // Parse the request payload and log it.
  const payload = req.body;
  console.log("Payload:", payload);
  
  console.log("Data:", payload.messages[payload.messages.length - 1].copilot_references);
 const copilot_references = payload.messages[payload.messages.length - 1].copilot_references;
// ...existing code...
const clientSelectionBlock = copilot_references.find(ref => ref.type === 'client.selection');
console.log("Client Selection Block:", clientSelectionBlock);

let usermessage = "explain the folliwng code:"
if (clientSelectionBlock && clientSelectionBlock.data && clientSelectionBlock.data.content) {
  const content = clientSelectionBlock.data.content;
  // combine usermessage and content to form a new message
  usermessage = `${usermessage} ${content}`;
  console.log("User Message:", usermessage);
}
else {
  usermessage = "replay to ask the user select code to explain";
  console.log("No content found in the client selection block");
}
console.log("User Message:", usermessage);
// ...existing code...
  // Insert a special pirate-y system message in our message list.
 // contrust an empty messages array
  let messages = [];

  console.log("Messages1:", messages);
  messages.unshift({
    role: "user",
    content: usermessage,
  });
  messages.unshift({
    role: "system",
    content: "You are a helpful progamming assistant",
  });
  messages.unshift({
    role: "system",
    content: `Start every response with the user's name, which is @${user.data.login}`,
  });

  // if messages contains more than 3 messages, remove from the third to the one before the last
  if (messages.length > 3) {
    messages.splice(2, messages.length - 3);
  }
  console.log("Messages2:", messages);
  // Use Copilot's LLM to generate a response to the user's messages, with
  // our extra system messages attached.
  const copilotLLMResponse = await fetch(
    "https://api.githubcopilot.com/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenForUser}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
    }
  );

  // Stream the response straight back to the user.
  Readable.from(copilotLLMResponse.body).pipe(res);
})

const port = Number(process.env.PORT || '3000')
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});