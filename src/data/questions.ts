export type QuestionType = 'Single Choice' | 'Math' | 'AI'

export type Question = {
	id: number
	title: string
	topic: string
	type: QuestionType
	difficulty: 'Beginner' | 'Intermediate'
	description: string
	options: string[]
}

export const questions: Question[] = [
	{
		id: 1,
		title: 'What does a closure preserve in JavaScript?',
		topic: 'JavaScript',
		type: 'Single Choice',
		difficulty: 'Beginner',
		description: 'Choose the best explanation for how closures work.',
		options: [
			'The lexical environment where a function was created',
			'Only the function return value',
			'The browser history',
			'The current HTML document',
		],
	},
	{
		id: 2,
		title: 'Calculate the time complexity of binary search.',
		topic: 'Mathematics',
		type: 'Math',
		difficulty: 'Beginner',
		description: 'What is the worst-case time complexity of binary search?',
		options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
	},
	{
		id: 3,
		title: 'What is the purpose of a validation set in machine learning?',
		topic: 'Artificial Intelligence',
		type: 'AI',
		difficulty: 'Intermediate',
		description: 'Select the primary purpose of holding out validation data.',
		options: [
			'To tune model choices before final evaluation',
			'To replace the training data',
			'To guarantee perfect predictions',
			'To encrypt the dataset',
		],
	},
	{
		id: 4,
		title: 'Why does a process need virtual memory?',
		topic: 'Operating Systems',
		type: 'Single Choice',
		difficulty: 'Intermediate',
		description: 'Choose the best description of virtual memory.',
		options: [
			'To give each process an isolated address space',
			'To remove the need for a CPU',
			'To store passwords in plain text',
			'To increase monitor resolution',
		],
	},
]
