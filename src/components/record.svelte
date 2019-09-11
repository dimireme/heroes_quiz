<script>
	import Image from '/components/image.svelte'
	export let item;

	const { id, question, answers } = item;
</script>



<div class="container">
	<div class="question">
        <span>{id+1}. {question.text}</span>
		{#if question.img} <Image img={question.img} />{/if}
	</div>
	{#each answers as answer}
		<div class="answer">
            <span>{answer.text}</span>
			{#if answer.img} <Image img={answer.img} />{/if}
		</div>
	{/each}
</div>



<style>
    .container {
        margin: 1em 0;
        padding: 0.5em;
        border: 1px solid bisque;
        border-radius: 6px;
        background-color: antiquewhite;
    }

    .question {
        display: flex;
        align-items: center;
    }

	.question > span {
		padding-right: 1em;
	}

    .answer {
        font-weight: bold;
        text-align: center;
        margin: 1em 0;
    }
</style>