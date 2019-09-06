const container = document.getElementById('answers');
const input = document.getElementById('filter');
const total = document.getElementById('total');

let filter = '';
let count = 0;
let questions = [];

document.addEventListener('keydown', (event) => {
	if (event.code === 'Escape') {
		input.focus();
		input.value = "";
		window.scrollTo({ top: 0, behavior: "smooth"});
		filter = "";
		refreshRecords("");
	}
});

function refreshRecords(filter) {
	container.innerHTML = "";
	
	const filtered_questions = questions.filter(({ question }) => (new RegExp(filter, 'i')).test(question));
	count = filtered_questions.length;
	total.innerHTML = `${filtered_questions.length} / ${questions.length}`;
	
	filtered_questions.forEach(({ id, question, answer }) => {
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
}

function handleChange(target) {
	filter = target.value;
	refreshRecords(filter);
}

function loadJSON(path, callback) {
	const obj = new XMLHttpRequest();
	obj.overrideMimeType("application/json");
	obj.open('GET', path, true);
	obj.onreadystatechange = function () {
		console.log('RES: ', obj);
		if (obj.readyState === 4 && obj.status === 200) {
			callback(JSON.parse(obj.responseText));
		}
	};
	obj.send(null);
}

function init() {
	loadJSON('./questions_pretty.json', function(response) {
		questions = response;
		refreshRecords("");
	});
}

init();
