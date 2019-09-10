<script>
	export let img;
	const { src, alt, width=50, height=50 } = img;
</script>

<img {src} {alt} {width} {height} />

<style>
	img {
		display: inline-block;
		line-height: 0;
	}
</style>