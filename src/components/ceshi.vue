<template>
	<div>
		<div class='container' v-bind:attr='message'>
			自定义组件:{{ msg }} {{ x }}
		</div>
		<div class='my-svg'>hello world</div>
		<Child :Width='100' v-bind:childArray="parentArray" v-bind:x="x"/>
	</div>
</template>

<script>
	import Child from './child.vue';
	export default {
		props:['msg'],
		components:{
			Child
		},
		data:()=>{
			return {
				parentArray:[],
				x:{
					name:'ashan',
					age:30
				},
				message:'hello'
			}
		}
	}
</script>

<style scoped>
	.container {
		color:red;
		margin:40px;
	}
</style>
