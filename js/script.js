const appState = {
    quizzes: [],
    currentQuiz: null,
    currentQuestionIndex: 0,
    score: 0,
    answers: []
};

/* ---------------- DOM Elements ---------------- */

const screens = {
    dashboard: document.getElementById('dashboard-screen'),
    create: document.getElementById('create-quiz-screen'),
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};

const elements = {
    quizList: document.getElementById('quiz-list'),

    // Create Screen
    createBtn: document.getElementById('create-quiz-btn'),
    saveQuizBtn: document.getElementById('save-quiz-btn'),
    cancelCreateBtn: document.getElementById('cancel-create-btn'),
    newQuizName: document.getElementById('new-quiz-name'),
    quizJsonInput: document.getElementById('quiz-json-input'),

    // Start Screen
    selectedQuizTitle: document.getElementById('selected-quiz-title'),
    totalQuestionsCount: document.getElementById('total-questions-count'),
    startBtn: document.getElementById('start-btn'),
    backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),

    // Quiz Screen
    questionNumber: document.getElementById('question-number'),
    scoreDisplay: document.getElementById('score-display'),
    progressBar: document.getElementById('progress-bar'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    nextBtn: document.getElementById('next-btn'),
    quitBtn: document.getElementById('quit-quiz-btn'),

    // Result Screen
    finalScore: document.getElementById('final-score'),
    totalQuestionsResult: document.getElementById('total-questions-result'),
    resultMessage: document.getElementById('result-message'),
    correctCount: document.getElementById('correct-count'),
    wrongCount: document.getElementById('wrong-count'),
    accuracy: document.getElementById('accuracy'),
    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn')
};

/* ---------------- Initialization ---------------- */

document.addEventListener('DOMContentLoaded', async () => {

    await loadQuizzes();

    // Buttons
    elements.createBtn.addEventListener(
        'click',
        () => showScreen('create')
    );

    elements.cancelCreateBtn.addEventListener(
        'click',
        () => showScreen('dashboard')
    );

    elements.saveQuizBtn.addEventListener(
        'click',
        saveNewQuiz
    );

    elements.backToDashboardBtn.addEventListener(
        'click',
        () => showScreen('dashboard')
    );

    elements.startBtn.addEventListener(
        'click',
        startQuizSession
    );

    elements.nextBtn.addEventListener(
        'click',
        nextQuestion
    );

    elements.quitBtn.addEventListener(
        'click',
        () => {

            if (
                confirm(
                    'Quit quiz? Progress will be lost.'
                )
            ) {
                showScreen('dashboard');
            }
        }
    );

    elements.restartBtn.addEventListener(
        'click',
        startQuizSession
    );

    elements.homeBtn.addEventListener(
        'click',
        () => showScreen('dashboard')
    );
});

/* ---------------- Load Quizzes ---------------- */

async function loadQuizzes() {

    try {

        // FILE NAME + UI NAME
        const quizFiles = [
            // {
            //     file: 'questions.json',
            //     name: 'Rashtra Gaurav'
            // },
            {
                file: 'question1.json',
                name: 'Rashtra Gaurav MCQ'
            },
            {
                file: 'question2.json',
                name: 'Rashtra Gaurav 2 MCQ'
            },
            {
                file: 'question3.json',
                name: 'Rashtra Gaurav 3 MCQ'
            },
            {
                file: 'question4.json',
                name: 'Rashtra Gaurav 4 MCQ'
            }
        ];

        const loadedQuizzes = [];

        for (const quiz of quizFiles) {

            try {

                const response =
                    await fetch(`data/${quiz.file}`);

                if (!response.ok) {

                    console.warn(
                        `${quiz.file} not found`
                    );

                    continue;
                }

                const data = await response.json();

                loadedQuizzes.push({
                    id: quiz.file.replace('.json', ''),
                    name: quiz.name,
                    questions: data
                });

            } catch (err) {

                console.error(
                    `Error loading ${quiz.file}`,
                    err
                );
            }
        }

        appState.quizzes = loadedQuizzes;

        renderQuizList();

    } catch (error) {

        console.error(
            'Failed to load quizzes:',
            error
        );
    }
}

/* ---------------- Save Quiz ---------------- */

function saveNewQuiz() {

    const name =
        elements.newQuizName.value.trim();

    const jsonStr =
        elements.quizJsonInput.value.trim();

    if (!name) {

        alert('Please enter quiz name');

        return;
    }

    if (!jsonStr) {

        alert('Please enter JSON');

        return;
    }

    try {

        const questions = JSON.parse(jsonStr);

        if (
            !Array.isArray(questions) ||
            questions.length === 0
        ) {

            throw new Error(
                'JSON must be non-empty array'
            );
        }

        const newQuiz = {
            id: 'custom_' + Date.now(),
            name: name,
            questions: questions
        };

        appState.quizzes.push(newQuiz);

        renderQuizList();

        elements.newQuizName.value = '';
        elements.quizJsonInput.value = '';

        showScreen('dashboard');

    } catch (e) {

        alert('Invalid JSON: ' + e.message);
    }
}

/* ---------------- Delete Quiz ---------------- */

function deleteQuiz(id) {

    if (
        confirm(
            'Delete this quiz?'
        )
    ) {

        appState.quizzes =
            appState.quizzes.filter(
                q => q.id !== id
            );

        renderQuizList();
    }
}

/* ---------------- Render Quiz List ---------------- */

function renderQuizList() {

    elements.quizList.innerHTML = '';

    if (appState.quizzes.length === 0) {

        elements.quizList.innerHTML = `
            <p style="text-align:center;">
                No quizzes found
            </p>
        `;

        return;
    }

    appState.quizzes.forEach(quiz => {

        const card =
            document.createElement('div');

        card.className = 'quiz-card';

        const totalQuestions =
            quiz.questions.length;

        card.innerHTML = `
            <div class="quiz-info">

                <h3>
                    ${quiz.name}
                </h3>

                <p>
                    ${totalQuestions} Questions
                </p>

            </div>

            <div class="quiz-actions">

                <button
                    class="action-btn btn-start"
                    onclick="selectQuiz('${quiz.id}')"
                >
                    Start
                </button>

                ${
                    quiz.id.startsWith('custom_')
                    ? `
                    <button
                        class="action-btn btn-delete"
                        onclick="deleteQuiz('${quiz.id}')"
                    >
                        Delete
                    </button>
                    `
                    : ''
                }

            </div>
        `;

        elements.quizList.appendChild(card);
    });
}

/* ---------------- Screen Switch ---------------- */

function showScreen(screenName) {

    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });

    screens[screenName].classList.add('active');
}

/* ---------------- Select Quiz ---------------- */

window.selectQuiz = function (id) {

    const quiz =
        appState.quizzes.find(
            q => q.id === id
        );

    if (!quiz) return;

    appState.currentQuiz = quiz;

    elements.selectedQuizTitle.textContent =
        quiz.name;

    elements.totalQuestionsCount.textContent =
        quiz.questions.length;

    showScreen('start');
};

window.deleteQuiz = deleteQuiz;

/* ---------------- Start Quiz ---------------- */

function startQuizSession() {

    if (!appState.currentQuiz) return;

    appState.currentQuestionIndex = 0;
    appState.score = 0;
    appState.answers = [];

    showScreen('quiz');

    loadQuestion();

    updateHeader();
}

/* ---------------- Load Question ---------------- */

function loadQuestion() {

    const question =
        appState.currentQuiz.questions[
            appState.currentQuestionIndex
        ];

    elements.questionText.textContent =
        question.question;

    elements.optionsContainer.innerHTML = '';

    elements.nextBtn.disabled = true;

    question.options.forEach(option => {

        const button =
            document.createElement('div');

        button.className = 'option';

        button.innerHTML = `
            <span>${option}</span>
        `;

        button.onclick = () =>
            handleOptionSelect(
                button,
                option,
                question.answer
            );

        elements.optionsContainer.appendChild(
            button
        );
    });
}

/* ---------------- Option Select ---------------- */

function handleOptionSelect(
    selectedButton,
    selectedOption,
    correctAnswer
) {

    const allOptions =
        elements.optionsContainer.children;

    const isCorrect =
        selectedOption === correctAnswer;

    Array.from(allOptions).forEach(btn => {

        btn.classList.add('disabled');

        btn.onclick = null;

        const text =
            btn.innerText.trim();

        if (text === correctAnswer) {

            btn.classList.add('correct');
        }
    });

    if (!isCorrect) {

        selectedButton.classList.add('wrong');

    } else {

        appState.score++;
    }

    appState.answers.push({
        questionIndex:
            appState.currentQuestionIndex,
        isCorrect: isCorrect
    });

    elements.nextBtn.disabled = false;

    updateHeader();
}

/* ---------------- Next Question ---------------- */

function nextQuestion() {

    appState.currentQuestionIndex++;

    if (
        appState.currentQuestionIndex <
        appState.currentQuiz.questions.length
    ) {

        loadQuestion();

        updateHeader();

        window.scrollTo(0, 0);

    } else {

        finishQuiz();
    }
}

/* ---------------- Header ---------------- */

function updateHeader() {

    const total =
        appState.currentQuiz.questions.length;

    const current =
        appState.currentQuestionIndex + 1;

    elements.questionNumber.textContent =
        `Q ${current}/${total}`;

    elements.scoreDisplay.textContent =
        `Score: ${appState.score}`;

    const progress =
        ((current - 1) / total) * 100;

    elements.progressBar.style.width =
        `${progress}%`;
}

/* ---------------- Finish Quiz ---------------- */

function finishQuiz() {

    const total =
        appState.currentQuiz.questions.length;

    const correct = appState.score;

    const wrong = total - correct;

    const accuracyVal =
        Math.round(
            (correct / total) * 100
        );

    elements.finalScore.textContent =
        correct;

    elements.totalQuestionsResult.textContent =
        total;

    elements.correctCount.textContent =
        correct;

    elements.wrongCount.textContent =
        wrong;

    elements.accuracy.textContent =
        `${accuracyVal}%`;

    let msg = '';

    if (accuracyVal === 100) {

        msg = 'Perfect Score!';

    } else if (accuracyVal >= 80) {

        msg = 'Excellent Work!';

    } else if (accuracyVal >= 50) {

        msg = 'Good Job!';

    } else {

        msg = 'Keep Practicing!';
    }

    elements.resultMessage.textContent =
        msg;

    showScreen('result');
}
