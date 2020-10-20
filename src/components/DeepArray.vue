<template>
	<div>
		<div v-for="(someClass, i) in array" :key="`class-${i}`">
			<span>{{ someClass.name }}</span>
		</div>
	</div>
</template>

<script>
	let array = [[{ name:'test1'},{ name:'test2'}],[{ name:'test3'}, { name:'test4'}]];
	export default {
		data(){
			let temp = array.reduce((sum,cur)=>{
				return sum.concat(cur);
			},[]);
			console.log(temp);
			return {
				
				array:temp
			}
		}
	}
</script>

<style>
</style>
