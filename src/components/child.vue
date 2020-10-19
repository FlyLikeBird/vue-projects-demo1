<template>
	<div>
		<span>接受了父组件传递值得子组件的childArray: {{ x }}</span>
		<button type='button' @click="changeArray">click</button>
		<button type='button' @click='changeFullName'>changeFullName</button>
		<p>Original message:{{ message }}</p>
		<p>reversed message:{{ reversedMessage }}</p>
		<p>{{ firstName }} {{ lastName }}</p>
		<p>{{ fullName }}</p>
		<svg class='my-svg'>
			<rect x='100' y='100' width='100' height='100' />
		</svg>
	</div>
</template>

<script>
	export default {
		name:'Child',
		props:{
			x:{
				type:Object
			}
		},
		data:function(){
			return {
				message:'Hello',
				world:'',
				firstName:'Foo',
				lastName:'Bar',
			}
		},
		computed:{
			reversedMessage:function(){
				return this.message.split('').reverse().join('');
			},
			fullName:{
				get:function(){
					return this.firstName + ' ' + this.lastName;
				},
				set:function(newValue){
					let nameArr = newValue.split(' ');
					this.firstName = nameArr[0];
					this.lastName = nameArr[1];
					console.log(this);
				}
			}
		},
		methods:{
			changeArray(){
				console.log(this);
				this.message = 'world';
			},
			changeFullName(){
				this.fullName = 'john dob'
			}
		}
	}
</script>

<style scoped>
	.my-svg {
		width:100%;
		height:100%;
		background-color:#ccc;
	}
</style>
