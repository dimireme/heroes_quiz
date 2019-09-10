<script>
    import list from '/constants/questions.json';
    import Input from '/components/input.svelte';
    import Counter from '/components/counter.svelte';
    import Record from '/components/record.svelte';

    let search = '';
    let searchRef;

	$: filteredQuestions = list.filter(({ question, answers }) => {
		const re = new RegExp(search, 'i');
		return (
			re.test(question.text) ||
			answers.some(answer => re.test(answer.text))
		);
	});

	$: count = filteredQuestions.length;
	$: total = list.length;

    const handleInput = ({ detail }) => {
        search = detail.value;
	};

    const handleKeydown = (event) => {
        if (event.code === 'Escape') {
            searchRef.setFocus();
            window.scrollTo({ top: 0, behavior: "smooth"}); // TODO: doesn't work.
            search = '';
        }
    };
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="questions__header">
	<Input className="input" placeholder="вопрос..." on:input={handleInput} value={search} bind:this={searchRef} />
	<Counter {count} {total} />
</div>

<div class="info-message">ESC - очистить фильтр</div>

<div id="answers" class="answers">
	{#each filteredQuestions as item (item.id)}
		<Record {item} />
	{/each}
</div>

<style>
	.questions__header {
		display: flex;
        align-items: center;
	}
    .questions__header :global(.input) {
        flex-grow: 1;
		padding-right: 1em;
    }
    .info-message {
        font-size: 0.6em;
    }
</style>
