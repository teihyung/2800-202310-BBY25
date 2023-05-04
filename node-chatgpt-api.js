const { Configuration, OpenAIApi } = require("openai");
const readlineSync = require("readline-sync");
require("dotenv").config();

(async () => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const history = [];

    while (true) {
        const user_input = readlineSync.question("Your input: ");

        const messages = [];
        for (const [input_text, completion_text] of history) {
            messages.push({ role: "user", content: input_text });
            messages.push({ role: "assistant", content: completion_text });
        }

        messages.push({ role: "user", content: user_input });

        try {
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
            });

            const completion_text = completion.data.choices[0].message.content;
            console.log(completion_text);

            history.push([user_input, completion_text]);

            const user_input_again = readlineSync.question(
                "\nWould you like to continue the conversation? (Y/N)"
            );
            if (user_input_again.toUpperCase() === "N") {
                return;
            } else if (user_input_again.toUpperCase() !== "Y") {
                console.log("Invalid input. Please enter 'Y' or 'N'.");
                return;
            }
        } catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
        }
    }
})();