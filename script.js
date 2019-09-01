const container = document.getElementById('answers');
const input = document.getElementById('filter');
const total = document.getElementById('total');

let filter = '';
let count = 0;

const refreshRecords = (filter) => {
	container.innerHTML = "";

	const filtered_questions = questions.filter(({ question }) => (new RegExp(filter, 'i')).test(question));
	count = filtered_questions.length;
	total.innerHTML = `Всего ${count} вопросов.`;

	filtered_questions.forEach(({ id, question, answer }, i) => {
		const div = document.createElement('div');
		
		const qwe = document.createElement('p');
		qwe.innerHTML = question;
		
		const ans = document.createElement('p');
		ans.innerHTML = answer;

		div.appendChild(qwe);
		div.appendChild(ans);

		container.appendChild(div);
	});
}

const handleChange = (target) => {
	filter = target.value;
	refreshRecords(filter);
};

refreshRecords("");

