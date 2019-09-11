<script>
    import list from '/constants/questions.json';
    import Input from '/components/input.svelte';
    import Counter from '/components/counter.svelte';
    import Record from '/components/record.svelte';

    let search = '';
    let searchRef;
    let headerRef;

	$: filteredQuestions = list.filter(({ question, answers }) => {
		const re = new RegExp(search, 'i');
		return (
			re.test(question.text) ||
			answers.some(answer => re.test(answer.text))
		);
	});

    const handleInput = ({ detail }) => {
        search = detail.value;
	};

    const handleKeydown = (event) => {
        if (event.code === 'Escape') {
            searchRef.setFocus();
            headerRef.scrollIntoView();
            search = '';
        }
    };
</script>



<svelte:window on:keydown={handleKeydown} />

<div class="questions__header" bind:this={headerRef} >
	<Input className="input" placeholder="вопрос..." on:input={handleInput} value={search} bind:this={searchRef} />
	<Counter count={filteredQuestions.length} total={list.length} />
</div>

<div class="info-message">ESC - очистить фильтр</div>

<div class="answers">
	{#each filteredQuestions as item (item.id)}
		<Record {item} />
	{/each}
</div>



<style>
	.questions__header {
		padding-top: 50px;
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
