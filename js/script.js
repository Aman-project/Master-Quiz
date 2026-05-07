const appState = {
    quizzes: [],
    currentQuiz: null,
    currentQuestionIndex: 0,
    score: 0,
    answers: []
};

/* --- DOM Elements --- */
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

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', async () => {
    loadQuizzes();

    // Event Listeners
    elements.createBtn.addEventListener('click', () => showScreen('create'));
    elements.cancelCreateBtn.addEventListener('click', () => showScreen('dashboard'));
    elements.saveQuizBtn.addEventListener('click', saveNewQuiz);

    elements.backToDashboardBtn.addEventListener('click', () => showScreen('dashboard'));
    elements.startBtn.addEventListener('click', startQuizSession);

    elements.nextBtn.addEventListener('click', nextQuestion);

    elements.quitBtn.addEventListener('click', () => {
        if (confirm('Quit the current quiz? Progress will be lost.')) {
            showScreen('dashboard');
        }
    });

    elements.restartBtn.addEventListener('click', startQuizSession);
    elements.homeBtn.addEventListener('click', () => showScreen('dashboard'));
});

/* --- Data Management --- */
async function loadQuizzes() {
    const storedQuizzes = localStorage.getItem('quizApp_quizzes');

    if (storedQuizzes) {
        appState.quizzes = JSON.parse(storedQuizzes);
    } else {
        try {

            // ADD ALL YOUR JSON FILES HERE
            const quizFiles = [
                'questions.json',
                'question1.json'
            ];

            const loadedQuizzes = [];

            for (const file of quizFiles) {

                const response = await fetch(`data/${file}`);

                if (!response.ok) {
                    console.warn(`${file} not found`);
                    continue;
                }

                const data = await response.json();

                loadedQuizzes.push({
                    id: file.replace('.json', ''),
                    name: formatQuizName(file),
                    questions: data
                });
            }

            appState.quizzes = loadedQuizzes;

            saveQuizzesToStorage();

        } catch (error) {
            console.error('Failed to load quizzes:', error);
            appState.quizzes = [];
        }
    }

    renderQuizList();
}

function formatQuizName(fileName) {
    return fileName
        .replace('.json', '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function saveQuizzesToStorage() {
    localStorage.setItem('quizApp_quizzes', JSON.stringify(appState.quizzes));
}

function saveNewQuiz() {

    const name = elements.newQuizName.value.trim();
    const jsonStr = elements.quizJsonInput.value.trim();

    if (!name) {
        alert('Please enter a quiz name.');
        return;
    }

    if (!jsonStr) {
        alert('Please enter JSON data.');
        return;
    }

    try {

        const questions = JSON.parse(jsonStr);

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('JSON must be a non-empty array.');
        }

        if (
            !questions[0].hasOwnProperty('question') ||
            !questions[0].hasOwnProperty('options') ||
            !questions[0].hasOwnProperty('answer')
        ) {
            throw new Error(
                'Each question must contain question, options, answer'
            );
        }

        const newQuiz = {
            id: 'custom_' + Date.now(),
            name: name,
            questions: questions
        };

        appState.quizzes.push(newQuiz);

        saveQuizzesToStorage();

        elements.newQuizName.value = '';
        elements.quizJsonInput.value = '';

        renderQuizList();

        showScreen('dashboard');

    } catch (e) {
        alert('Invalid JSON: ' + e.message);
    }
}

function deleteQuiz(id) {

    if (confirm('Are you sure you want to delete this quiz?')) {

        appState.quizzes = appState.quizzes.filter(
            q => q.id !== id
        );

        saveQuizzesToStorage();

        renderQuizList();
    }
}

/* --- UI Rendering --- */
function showScreen(screenName) {

    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });

    screens[screenName].classList.add('active');

    screens[screenName].style.opacity = 0;

    setTimeout(() => {
        screens[screenName].style.opacity = 1;
        screens[screenName].style.transition = 'opacity 0.3s ease';
    }, 10);
}

function renderQuizList() {

    elements.quizList.innerHTML = '';

    if (appState.quizzes.length === 0) {

        elements.quizList.innerHTML = `
            <p style="text-align:center; margin-top:2rem;">
                No quizzes found
            </p>
        `;

        return;
    }

    appState.quizzes.forEach(quiz => {

        const card = document.createElement('div');

        card.className = 'quiz-card';

        const questionCount = quiz.questions
            ? quiz.questions.length
            : 0;

        card.innerHTML = `
            <div class="quiz-info">
                <h3>
                    <i class="ri-file-text-line"
                       style="margin-right:8px;">
                    </i>
                    ${quiz.name}
                </h3>

                <p style="padding-left:2rem;">
                    ${questionCount} Questions
                </p>
            </div>

            <div class="quiz-actions"
                 style="display:flex; gap:0.5rem;">

                <button class="action-btn btn-start"
                        onclick="selectQuiz('${quiz.id}')">

                    <i class="ri-play-fill"></i>
                    Start
                </button>

                ${
                    quiz.id.startsWith('custom_')
                    ? `
                    <button class="action-btn btn-delete"
                            onclick="deleteQuiz('${quiz.id}')">

                        <i class="ri-delete-bin-line"></i>
                    </button>
                    `
                    : ''
                }
            </div>
        `;

        elements.quizList.appendChild(card);
    });
}

/* --- Global Functions --- */
window.selectQuiz = function (id) {

    const quiz = appState.quizzes.find(
        q => q.id === id
    );

    if (!quiz) return;

    appState.currentQuiz = quiz;

    elements.selectedQuizTitle.textContent = quiz.name;

    elements.totalQuestionsCount.textContent =
        quiz.questions.length;

    showScreen('start');
};

window.deleteQuiz = deleteQuiz;

/* --- Quiz Logic --- */
function startQuizSession() {

    if (!appState.currentQuiz) return;

    appState.currentQuestionIndex = 0;
    appState.score = 0;
    appState.answers = [];

    showScreen('quiz');

    loadQuestion();

    updateHeader();
}

function loadQuestion() {

    const question =
        appState.currentQuiz.questions[
            appState.currentQuestionIndex
        ];

    elements.questionText.textContent =
        question.question;

    elements.optionsContainer.innerHTML = '';

    elements.nextBtn.disabled = true;

    question.options.forEach(optionText => {

        const button = document.createElement('div');

        button.className = 'option';

        button.innerHTML = `
            <i class="ri-checkbox-blank-circle-line"
               style="margin-right:12px;
                      font-size:1.2rem;
                      color:var(--text-muted);">
            </i>

            <span>${optionText}</span>
        `;

        button.onclick = () =>
            handleOptionSelect(
                button,
                optionText,
                question.answer
            );

        elements.optionsContainer.appendChild(button);
    });
}

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

        const textSpan = btn.querySelector('span');

        const icon = btn.querySelector('i');

        if (textSpan.textContent === correctAnswer) {

            btn.classList.add('correct');

            icon.className =
                'ri-checkbox-circle-fill';

            icon.style.color = '#fff';
        }
    });

    if (!isCorrect) {

        selectedButton.classList.add('wrong');

        const icon =
            selectedButton.querySelector('i');

        icon.className = 'ri-close-circle-fill';

        icon.style.color = '#fff';

    } else {

        appState.score++;
    }

    appState.answers.push({
        questionIndex: appState.currentQuestionIndex,
        isCorrect: isCorrect
    });

    elements.nextBtn.disabled = false;

    updateHeader();
}

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

/* --- Result --- */
function finishQuiz() {

    const total =
        appState.currentQuiz.questions.length;

    const correct = appState.score;

    const wrong = total - correct;

    const accuracyVal =
        Math.round((correct / total) * 100);

    elements.finalScore.textContent = correct;

    elements.totalQuestionsResult.textContent =
        total;

    elements.correctCount.textContent = correct;

    elements.wrongCount.textContent = wrong;

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

    elements.resultMessage.textContent = msg;

    showScreen('result');
}
