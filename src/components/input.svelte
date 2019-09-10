<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

    export let className = '';
	export let placeholder = '';
	export let value = '';
	export let type = 'text';

	let inputRef;
	export const setFocus = () => inputRef.focus();

	const handleInput = (event) => {
		dispatch('input', {
			value: event.target.value,
        });
	}
</script>

<label class="{className}">
	<input {type} {value} {placeholder} on:input={handleInput} bind:this={inputRef} />
</label>

<style>
    input {
		display: block;
		width: 100%;
    }
</style>