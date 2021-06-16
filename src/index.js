// external packages
const express = require('express');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(express.urlencoded({
    extended: true
}));
webApp.use(express.json());

// Server Port
const PORT = process.env.PORT || 5000;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

// Require the Questions and Answers
const QA = require('../database/qa');

// Handle action userProvidesDifficultyLevel
const userProvidesDifficultyLevel = (req) => {

    let difficulty_level = req.body.queryResult.parameters.difficulty_level;

    if (difficulty_level > 5) {
        // set the context
        let session = req.body.session;
        let awaitDifficulty = `${session}/contexts/await-difficulty`;
        let sessionContext = `${session}/contexts/session`;

        return {
            fulfillmentText: `We don't have level ${difficulty_level} at this time. Select a difficulty level between a number 1 to 5.`,
            fulfillmentMessages: [
                {
                    text: {
                        text: [`We don't have level ${difficulty_level} at this time. Select a difficulty level between a number 1 to 5.`]
                    }
                }
            ],
            outputContexts: [{
                name: awaitDifficulty,
                lifespanCount: 1
            }, {
                name: sessionContext,
                lifespanCount: 20
            }]
        };
    } else {
        let counter = 0;
        let score = 0;

        let qa = QA.quizDictionary[difficulty_level];
        let numberOfQuestions = Object.keys(qa).length;
        console.log(`Max length of questions --> ${numberOfQuestions}`);
        let randomQANumbers = []
        Array.from({ length: 5 }, () => randomQANumbers.push(Math.floor(Math.random() * numberOfQuestions)));
        console.log('Random numbers for question');
        console.log(randomQANumbers);
        let selectedQA = [];
        for (let index = 0; index < 5; index++) {
            selectedQA.push(qa[randomQANumbers[index] + 1]);
        }

        console.log(`Selected questions -->`);
        console.log(selectedQA);

        // set the context
        let session = req.body.session;
        let awaitAnswer = `${session}/contexts/await-answer`;
        let sessionContext = `${session}/contexts/session`;

        let randomQuestionNumber = Math.floor(Math.random() * selectedQA[counter].question.length);

        return {
            fulfillmentText: `(${counter + 1}) ${selectedQA[counter].question[randomQuestionNumber]}.`,
            fulfillmentMessages: [
                {
                    text: {
                        text: [`(${counter + 1}) ${selectedQA[counter].question[randomQuestionNumber]}.`]
                    }
                }
            ],
            outputContexts: [{
                name: awaitAnswer,
                lifespanCount: 1
            }, {
                name: sessionContext,
                lifespanCount: 20,
                parameters: {
                    counter: counter,
                    score: score,
                    selectedQA: selectedQA
                }
            }]
        };
    }
};

// Handle userProvidesAnswer
const userProvidesAnswer = (req) => {

    let outputContexts = req.body.queryResult.outputContexts;

    let counter, score, selectedQA, userAnswer;

    outputContexts.forEach(outputContext => {
        let thisSession = outputContext.name;
        if (thisSession.includes('/contexts/session')) {
            counter = Number(outputContext.parameters.counter);
            score = Number(outputContext.parameters.score);
            selectedQA = outputContext.parameters.selectedQA;
            userAnswer = String(outputContext.parameters.answer);
        }
    });

    let prefferedAnswer = selectedQA[counter].prefferedAnswer;
    let alternateAnswers = selectedQA[counter].alternateAnswers;

    // Replaced this with two step answer check
    // let flag = false;
    // correctAnswers.forEach(ca => {
    //     if (String(ca) === userAnswer.trim()) {
    //         flag = true;
    //         score += 1;
    //     }
    // });

    let flag = false;

    if (String(prefferedAnswer[0]) === userAnswer.trim()) {
        flag = true;
        score += 1;
    } else {
        alternateAnswers.forEach(as => {
            console.log(`Alternate answer --> ${as}`);
            if (String(as) === userAnswer.trim()) {
                flag = true;
                score += 1;
            }
        });
    }

    console.log(`Preffered answer --> ${prefferedAnswer}`);
    console.log('Alternate answer --> ');
    console.log(alternateAnswers);
    console.log(`User answer --> ${userAnswer}`);
    console.log(`Score --> ${score}`);

    // Rigth answer
    if (flag && counter != 4) {
        counter += 1;

        // set the context
        let session = req.body.session;
        let awaitAnswer = `${session}/contexts/await-answer`;
        let sessionContext = `${session}/contexts/session`;

        let randomQuestionNumber = Math.floor(Math.random() * selectedQA[counter].question.length);

        return {
            fulfillmentText: `Great, that is a right answer. Here is your next question ${selectedQA[counter].question[randomQuestionNumber]}.`,
            fulfillmentMessages: [
                {
                    text: {
                        text: [`Great, that is a right answer. Here is your next question ${selectedQA[counter].question[randomQuestionNumber]}.`]
                    }
                }
            ],
            outputContexts: [{
                name: awaitAnswer,
                lifespanCount: 1
            }, {
                name: sessionContext,
                lifespanCount: 20,
                parameters: {
                    counter: counter,
                    score: score,
                    selectedQA: selectedQA
                }
            }]
        };
        // Wrong answer
    } else if (!flag && counter != 4) {
        counter += 1;

        // set the context
        let session = req.body.session;
        let awaitAnswer = `${session}/contexts/await-answer`;
        let sessionContext = `${session}/contexts/session`;

        let randomQuestionNumber = Math.floor(Math.random() * selectedQA[counter].question.length);

        return {
            fulfillmentText: `Sorry ${userAnswer} is a wrong, the correct answer is ${prefferedAnswer[0]}. Here is your next question ${selectedQA[counter].question[randomQuestionNumber]}.`,
            fulfillmentMessages: [
                {
                    text: {
                        text: [`Sorry ${userAnswer} is a wrong, the correct answer is ${prefferedAnswer[0]}. Here is your next question ${selectedQA[counter].question[randomQuestionNumber]}.`]
                    }
                }
            ],
            outputContexts: [{
                name: awaitAnswer,
                lifespanCount: 1
            }, {
                name: sessionContext,
                lifespanCount: 20,
                parameters: {
                    counter: counter,
                    score: score,
                    selectedQA: selectedQA
                }
            }]
        };
        // Show score and right answer
    } else if (flag) {
        let session = req.body.session;
        let awaitAnswer = `${session}/contexts/await-answer`;
        let sessionContext = `${session}/contexts/session`;
        let awaitDifficulty = `${session}/contexts/await-difficulty`;

        let outString = '';

        if (score == 5) {
            outString += `Great, that is a right answer. High five!. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        } else if (score == 4) {
            outString += `Great, that is a right answer. You did a great job. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        } else {
            outString += `Great, that is a right answer. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        }

        return {
            fulfillmentText: outString,
            fulfillmentMessages: [
                {
                    text: {
                        text: [outString]
                    }
                }
            ],
            outputContexts: [{
                name: awaitAnswer,
                lifespanCount: 0
            }, {
                name: sessionContext,
                lifespanCount: 0
            }, {
                name: awaitDifficulty,
                lifespanCount: 1
            }]
        };
        // Show score and wrong answer
    } else {
        let session = req.body.session;
        let awaitAnswer = `${session}/contexts/await-answer`;
        let sessionContext = `${session}/contexts/session`;
        let awaitDifficulty = `${session}/contexts/await-difficulty`;

        let outString = '';

        if (score == 5) {
            outString += `Sorry ${userAnswer} is a wrong, the correct answer is ${prefferedAnswer[0]}. High five!. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        } else if (score == 4) {
            outString += `Sorry ${userAnswer} is a wrong, the correct answer is ${prefferedAnswer[0]}. You did a great job. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        } else {
            outString += `Sorry ${userAnswer} is a wrong, the correct answer is ${prefferedAnswer[0]}. Your score is ${score} out of 5. To start the quiz again type please choose a level between 1 to 5.`
        }

        return {
            fulfillmentText: outString,
            fulfillmentMessages: [
                {
                    text: {
                        text: [outString]
                    }
                }
            ],
            outputContexts: [{
                name: awaitAnswer,
                lifespanCount: 0
            }, {
                name: sessionContext,
                lifespanCount: 0
            }, {
                name: awaitDifficulty,
                lifespanCount: 1
            }]
        };
    }
}

// Webhook route for Dialogflow
webApp.post('/webhook', (req, res) => {

    let action = req.body.queryResult.action;

    console.log('Webhook called.');
    console.log(`Action name --> ${action}`);

    let responseData = {};

    if (action === 'userProvidesDifficultyLevel') {
        responseData = userProvidesDifficultyLevel(req);
    } else if (action === 'userProvidesAnswer') {
        responseData = userProvidesAnswer(req);
    }
    else {
        responseData = {
            fulfillmentText: `Unknown action name. No action defined for this on the webhook.`,
            fulfillmentMessages: [
                {
                    text: {
                        text: [`Unknown action name. No action defined for this on the webhook.`]
                    }
                }
            ]
        }
    }

    res.send(responseData);
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});