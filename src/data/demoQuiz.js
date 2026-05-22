export const DEMO_TOKEN = 'demo'
export const DEMO_QUIZ_ID = 'demo-quiz'
export const DEMO_CLASS_ID = 'demo-class'
export const DEMO_SUBMISSION_ID = 'demo-local'

const year = new Date().getFullYear()

export const DEMO_QUIZ = {
  id: DEMO_QUIZ_ID,
  title: 'General Knowledge Demo',
  description: 'Try a short sample quiz — no account needed.',
  public_token: DEMO_TOKEN,
  start_at: `${year - 1}-01-01T00:00:00.000Z`,
  end_at: `${year + 2}-12-31T23:59:59.000Z`,
  is_paused: false,
}

export const DEMO_CLASSES = [{ id: DEMO_CLASS_ID, class_name: 'Demo' }]

function q(id, text, orderIndex, options) {
  return {
    id,
    quiz_id: DEMO_QUIZ_ID,
    question_text: text,
    time_limit: 30,
    order_index: orderIndex,
    options,
  }
}

function opt(id, text, correct = false) {
  return { id, option_text: text, is_correct: correct }
}

export const DEMO_QUESTIONS = [
  q('demo-q-1', 'What is the capital of France?', 0, [
    opt('demo-q-1-a', 'London'),
    opt('demo-q-1-b', 'Paris', true),
    opt('demo-q-1-c', 'Berlin'),
    opt('demo-q-1-d', 'Madrid'),
  ]),
  q('demo-q-2', 'Which planet is the largest in our solar system?', 1, [
    opt('demo-q-2-a', 'Saturn'),
    opt('demo-q-2-b', 'Jupiter', true),
    opt('demo-q-2-c', 'Neptune'),
    opt('demo-q-2-d', 'Mars'),
  ]),
  q('demo-q-3', 'What is 15 + 27?', 2, [
    opt('demo-q-3-a', '40'),
    opt('demo-q-3-b', '42', true),
    opt('demo-q-3-c', '44'),
    opt('demo-q-3-d', '52'),
  ]),
  q('demo-q-4', 'What does H₂O commonly refer to?', 3, [
    opt('demo-q-4-a', 'Salt'),
    opt('demo-q-4-b', 'Water', true),
    opt('demo-q-4-c', 'Oxygen'),
    opt('demo-q-4-d', 'Hydrogen'),
  ]),
  q('demo-q-5', 'How many continents are there on Earth?', 4, [
    opt('demo-q-5-a', '5'),
    opt('demo-q-5-b', '6'),
    opt('demo-q-5-c', '7', true),
    opt('demo-q-5-d', '8'),
  ]),
  q('demo-q-6', 'Who wrote Romeo and Juliet?', 5, [
    opt('demo-q-6-a', 'Charles Dickens'),
    opt('demo-q-6-b', 'William Shakespeare', true),
    opt('demo-q-6-c', 'Jane Austen'),
    opt('demo-q-6-d', 'Mark Twain'),
  ]),
  q('demo-q-7', 'Which language is mainly spoken in Brazil?', 6, [
    opt('demo-q-7-a', 'Spanish'),
    opt('demo-q-7-b', 'Portuguese', true),
    opt('demo-q-7-c', 'French'),
    opt('demo-q-7-d', 'Italian'),
  ]),
  q('demo-q-8', 'What is the largest mammal on Earth?', 7, [
    opt('demo-q-8-a', 'African elephant'),
    opt('demo-q-8-b', 'Blue whale', true),
    opt('demo-q-8-c', 'Giraffe'),
    opt('demo-q-8-d', 'Polar bear'),
  ]),
  q('demo-q-9', 'In which year did the first Moon landing take place?', 8, [
    opt('demo-q-9-a', '1965'),
    opt('demo-q-9-b', '1969', true),
    opt('demo-q-9-c', '1972'),
    opt('demo-q-9-d', '1980'),
  ]),
  q('demo-q-10', 'Which of these are primary colors? (Select all that apply)', 9, [
    opt('demo-q-10-a', 'Red', true),
    opt('demo-q-10-b', 'Green'),
    opt('demo-q-10-c', 'Blue', true),
    opt('demo-q-10-d', 'Yellow', true),
  ]),
]
