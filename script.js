const container = document.getElementById('answers');
const input = document.getElementById('filter');
const total = document.getElementById('total');

let filter = '';
let count = 0;

const refreshRecords = (filter) => {
	container.innerHTML = "";

	const filtered_questions = questions.filter(({ question }) => (new RegExp(filter, 'i')).test(question));
	count = filtered_questions.length;
	total.innerHTML = `${filtered_questions.length} / ${questions.length}`;

	filtered_questions.forEach(({ id, question, answer }, i) => {
		const div = document.createElement('div');
		div.className = "question";
		
		const qwe = document.createElement('p');
		qwe.innerHTML = `${id+1}. ${question}`;
		qwe.className = "question-text";
		
		const ans = document.createElement('p');
		ans.innerHTML = answer;
		ans.className = "question-answer";

		div.appendChild(qwe);
		div.appendChild(ans);

		container.appendChild(div);
	});
};

const handleChange = (target) => {
	filter = target.value;
	refreshRecords(filter);
};

refreshRecords("");

