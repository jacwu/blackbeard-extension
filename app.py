from flask import Flask, request, Response, stream_with_context
import requests


app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    print("adadfadf")
    return "Ahoy, matey! Welcome to the Blackbeard Pirate GitHub Copilot Extension!"

@app.route("/", methods=["POST"])
def handle_post():
    # 获取GitHub token并识别用户
    token_for_user = request.headers.get("X-GitHub-Token")
    
    user = "kk"
    print("User:", user.login)

    # 解析请求数据
    payload = request.get_json()
    print("Payload:", payload)
    
    copilot_references = payload["messages"][-1]["copilot_references"]
    client_selection_block = next(
        (ref for ref in copilot_references if ref["type"] == "client.selection"),
        None
    )
    print("Client Selection Block:", client_selection_block)

    # 构建用户消息
    user_message = "check the following code is Python or not. If it is python, clarify whether the code meets the code gudeline; if not python, let the user know you only work on Python. code block:"
    if client_selection_block and "data" in client_selection_block and "content" in client_selection_block["data"]:
        content = client_selection_block["data"]["content"]
        user_message = f"{user_message} {content}"
        print("User Message:", user_message)
    else:
        user_message = "replay to ask the user select code to explain"
        print("No content found in the client selection block")
    
    print("User Message:", user_message)

    # 构建消息列表
    messages = []
    messages.insert(0, {
        "role": "user",
        "content": user_message
    })
    messages.insert(0, {
        "role": "system",
        "content": "You are a helpful python progamming assistant named PythonGenie, you understand the python code guidelines:Variable and Function Names should use lowercase letters with words separated by underscores (snake_case); Class Names should use capitalized words without underscores (CamelCase); Constant Names should use all uppercase letters with words separated by underscores."
    })
    messages.insert(0, {
        "role": "system",
        "content": f"Start every response with the user's name, which is @{user.login}, and also say 'my name is PythonGenie'."
    })

    # 保持最新的3条消息
    if len(messages) > 3:
        messages[2:len(messages)-1] = []
    
    print("Messages:", messages)

    # 调用Copilot API
    def generate():
        response = requests.post(
            "https://api.githubcopilot.com/chat/completions",
            headers={
                "Authorization": f"Bearer {token_for_user}",
                "Content-Type": "application/json"
            },
            json={"messages": messages, "stream": True},
            stream=True
        )
        for chunk in response.iter_content(chunk_size=None):
            yield chunk

    return Response(stream_with_context(generate()), mimetype='application/json')

if __name__ == "__main__":
    app.run(debug=True)