<template>
	<div>
		<p>
			Ask a yes/no question:
			<input v-model="question" />
		</p>
		<p>{{ answer }}</p>
	</div>
</template>

<script>
	let timer = null;
	export default {
		data(){
			return {
				question:'',
				answer:'I cannot give your answer until you ask a question !'
			}
		},
		watch:{
			question:function(newValue, oldValue){
				this.answer = 'waiting for you to stop typing'
				this.fetchAnswer();
			}
		},
		created:function(){
			this.fetchAnswer = function(){
				clearTimeout(timer);
				timer = setTimeout(()=>{
					this.getAnswer();
				},500);
			}
		},
		methods:{
			getAnswer:function(){
				
			}
		}
	}
</script>

<style>
</style>
